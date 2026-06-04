/**
 * Configuración centralizada de entorno.
 * Los valores por defecto apuntan a DummyJSON (API pública de prueba).
 * Para sobreescribir, exporta las variables antes de correr las pruebas:
 *   export API_BASE_URL=https://mi-api.com
 */
export const ENV = {
  /** Base URL de la API bajo prueba */
  BASE_URL: process.env.API_BASE_URL ?? 'https://dummyjson.com',

  /** Credenciales de autenticación */
  AUTH: {
    USERNAME: process.env.TEST_USERNAME ?? 'emilys',
    PASSWORD: process.env.TEST_PASSWORD ?? 'emilyspass',
    INVALID_USERNAME: 'hacker_tryhard',
    INVALID_PASSWORD: 'wrongPass999',
  },

  /** SLA máximo de respuesta en milisegundos */
  SLA_MS: Number(process.env.SLA_MS ?? 1500),

  /** Kafka */
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  KAFKA_TOPIC: process.env.KAFKA_TOPIC ?? 'gps-raw-events',
  KAFKA_CLIENT_ID: 'qa-automation-avl',
  KAFKA_GROUP_ID: 'qa-consumer-group',
};
