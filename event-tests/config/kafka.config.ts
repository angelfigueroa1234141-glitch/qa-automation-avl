import { Kafka, logLevel } from 'kafkajs';
import { ENV } from '../../api-tests/config/env';

/**
 * Instancia única de Kafka reutilizable en todos los tests.
 * Apunta al broker configurado en ENV.KAFKA_BROKERS (default: localhost:9092).
 */
export const kafka = new Kafka({
  clientId: ENV.KAFKA_CLIENT_ID,
  brokers: ENV.KAFKA_BROKERS,
  logLevel: logLevel.WARN,   // Silenciar logs de conexión durante tests
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});

/** Tópico principal de telemetría GPS */
export const GPS_TOPIC = ENV.KAFKA_TOPIC;

/** Grupo de consumidores para los tests de QA */
export const QA_GROUP_ID = ENV.KAFKA_GROUP_ID;
