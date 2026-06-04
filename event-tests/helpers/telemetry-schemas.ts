export interface TelemetryEvent {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;       // km/h
  heading?: number;    // grados 0-360
  altitude?: number;   // metros
  satellites?: number;
  timestamp: string;   // ISO 8601
  source?: string;
}

export const telemetrySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'TelemetryEvent',
  type: 'object',
  required: ['vehicleId', 'lat', 'lng', 'speed', 'timestamp'],
  additionalProperties: true,
  properties: {
    vehicleId:  { type: 'string', minLength: 1, pattern: '^VEH-\\d+$' },
    lat:        { type: 'number', minimum: -90,   maximum: 90  },
    lng:        { type: 'number', minimum: -180,  maximum: 180 },
    speed:      { type: 'number', minimum: 0,     maximum: 300 },
    heading:    { type: 'number', minimum: 0,     maximum: 360 },
    altitude:   { type: 'number' },
    satellites: { type: 'integer', minimum: 0 },
    timestamp:  { type: 'string', format: 'date-time' },
  },
};

// Coordenadas por defecto: Bogotá, Colombia
export function createTelemetryEvent(overrides?: Partial<TelemetryEvent>): TelemetryEvent {
  return {
    vehicleId:  'VEH-99',
    lat:        4.710989,
    lng:       -74.072092,
    speed:      65,
    heading:    180,
    altitude:   2625,
    satellites: 9,
    timestamp:  new Date().toISOString(),
    source:     'qa-automation',
    ...overrides,
  };
}

export function createFleetEvents(count: number): TelemetryEvent[] {
  return Array.from({ length: count }, (_, i) => createTelemetryEvent({
    vehicleId: `VEH-${String(i + 1).padStart(2, '0')}`,
    lat:       4.710989 + (Math.random() - 0.5) * 0.1,
    lng:      -74.072092 + (Math.random() - 0.5) * 0.1,
    speed:     Math.floor(Math.random() * 120),
  }));
}
