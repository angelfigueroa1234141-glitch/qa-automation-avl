import { test, expect } from '@playwright/test';
import { kafka, GPS_TOPIC, QA_GROUP_ID } from '../config/kafka.config';
import {
  createTelemetryEvent,
  createFleetEvents,
  telemetrySchema,
  TelemetryEvent,
} from '../helpers/telemetry-schemas';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateTelemetry = ajv.compile(telemetrySchema);

const CONSUMER_TIMEOUT_MS = 15_000;

async function publishAndConsume(
  payload: TelemetryEvent,
  correlationId: string
): Promise<TelemetryEvent> {
  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: `${QA_GROUP_ID}-${correlationId}` });

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: GPS_TOPIC, fromBeginning: false });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: mensaje "${correlationId}" no recibido en ${CONSUMER_TIMEOUT_MS}ms`));
    }, CONSUMER_TIMEOUT_MS);

    consumer.run({
      eachMessage: async ({ message }) => {
        const value = message.value?.toString();
        if (!value) return;

        const parsed: TelemetryEvent = JSON.parse(value);
        if (parsed.vehicleId === payload.vehicleId && parsed.source?.includes(correlationId)) {
          clearTimeout(timer);
          await consumer.disconnect();
          await producer.disconnect();
          resolve(parsed);
        }
      },
    });

    // Publicar después de suscribirse para evitar race condition
    setTimeout(async () => {
      await producer.send({
        topic: GPS_TOPIC,
        messages: [{
          key: payload.vehicleId,
          value: JSON.stringify({ ...payload, source: `qa-${correlationId}` }),
        }],
      });
    }, 500);
  });
}

test.describe('Kafka — Telemetría GPS (gps-raw-events)', () => {

  test.beforeAll(async () => {
    const admin = kafka.admin();
    await admin.connect();

    const existingTopics = await admin.listTopics();
    if (!existingTopics.includes(GPS_TOPIC)) {
      await admin.createTopics({
        topics: [{ topic: GPS_TOPIC, numPartitions: 1, replicationFactor: 1 }],
      });
      console.log(`Tópico "${GPS_TOPIC}" creado`);
    } else {
      console.log(`Tópico "${GPS_TOPIC}" ya existe`);
    }

    await admin.disconnect();
  });

  test('TC-KAFKA-01 | Publicar un evento GPS y recibirlo íntegro con schema válido', async () => {
    const payload = createTelemetryEvent({ vehicleId: 'VEH-99' });
    const correlationId = `test-01-${Date.now()}`;

    const received = await publishAndConsume(
      { ...payload, source: `qa-${correlationId}` },
      correlationId
    );

    const valid = validateTelemetry(received);
    if (!valid) {
      const errors = validateTelemetry.errors?.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
      throw new Error(`Schema inválido:\n${errors}`);
    }
    expect(valid).toBe(true);

    expect(received.vehicleId).toBe('VEH-99');
    expect(received.lat).toBeCloseTo(4.710989, 3);
    expect(received.lng).toBeCloseTo(-74.072092, 3);
    expect(received.speed).toBe(65);
    expect(new Date(received.timestamp).getTime()).toBeGreaterThan(0);

    console.log(`Evento recibido correctamente: ${received.vehicleId} a ${received.speed}km/h`);
  });

  test('TC-KAFKA-02 | Publicar batch de 5 eventos de flota sin errores', async () => {
    const producer = kafka.producer();
    await producer.connect();

    const fleetEvents = createFleetEvents(5);
    const messages = fleetEvents.map(event => ({
      key: event.vehicleId,
      value: JSON.stringify(event),
    }));

    const recordMetadata = await producer.send({ topic: GPS_TOPIC, messages });
    await producer.disconnect();

    expect(recordMetadata.length).toBeGreaterThan(0);
    recordMetadata.forEach(meta => {
      expect(meta.errorCode).toBe(0);
    });

    console.log(`${fleetEvents.length} eventos publicados — partición: ${recordMetadata[0].partition}, offset: ${recordMetadata[0].baseOffset}`);
  });

  test('TC-KAFKA-03 | Schema acepta evento con solo los campos requeridos', async () => {
    const minimalEvent: TelemetryEvent = {
      vehicleId: 'VEH-01',
      lat: 4.60,
      lng: -74.08,
      speed: 0,
      timestamp: new Date().toISOString(),
    };

    expect(validateTelemetry(minimalEvent)).toBe(true);
  });

  test('TC-KAFKA-04 | Schema rechaza velocidad negativa', async () => {
    const invalidEvent = {
      vehicleId: 'VEH-01',
      lat: 4.60,
      lng: -74.08,
      speed: -50,
      timestamp: new Date().toISOString(),
    };

    expect(validateTelemetry(invalidEvent)).toBe(false);
  });

  test('TC-KAFKA-05 | Schema rechaza coordenadas GPS fuera de rango', async () => {
    const invalidCoords = [
      { lat: 200,  lng: -74.08 },  // lat > 90
      { lat: 4.60, lng: 200    },  // lng > 180
      { lat: -100, lng: -74.08 },  // lat < -90
    ];

    invalidCoords.forEach(coords => {
      const event = { vehicleId: 'VEH-01', ...coords, speed: 60, timestamp: new Date().toISOString() };
      expect(validateTelemetry(event)).toBe(false);
    });
  });
});
