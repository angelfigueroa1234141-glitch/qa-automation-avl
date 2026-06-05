# Bitácora de Co-Pilotaje con IA

## Herramienta utilizada

Claude (Anthropic) — usado para arquitectura del proyecto, generación de boilerplate, configuración de Kafka y flujos de Maestro.

## Casos de uso

**Estructura inicial del proyecto**
Claude generó la separación por capas (mobile-tests/, api-tests/, event-tests/) y los archivos de configuración base.

**Helpers reutilizables**
Claude propuso centralizar la validación de schemas en schema-validator.ts y la medición de SLA en performance.ts.

**Setup de Kafka con KRaft**
Claude orientó la configuración del docker-compose.yml para usar Kafka sin Zookeeper.

**Flujos de Maestro**
Claude generó la estructura base de los flujos YAML para la capa móvil.

## Prompts clave

Prompt 1:
```
Necesito una arquitectura de tests de API usando @playwright/test
contra DummyJSON con JSON Schema validation (AJV), SLA < 1500ms
y helpers reutilizables separados de los specs.
```

Prompt 2:
```
Necesito un docker-compose.yml con Kafka KRaft (sin Zookeeper)
usando bitnami/kafka:3.7 y un helper publishAndConsume() que conecte
producer y consumer en el mismo test con timeout configurable.
Tópico: gps-raw-events.
```

## Lo que resolví yo

**Error token vs accessToken**
DummyJSON cambió su API de token a accessToken y los tests fallaban. Lo detecté abriendo el trace de Playwright y leyendo la respuesta real. La solución fue una función extractToken() que acepta ambos campos:

```typescript
function extractToken(body: AuthResponse): string {
  return body.accessToken ?? body.token ?? '';
}
```

**Ajuste de JSON Schemas**
Los schemas generados tenían campos required demasiado estrictos. Revisé las respuestas reales de DummyJSON y ajusté los required a solo los campos críticos, agregando compatibilidad para accessToken y token.

**Error TC-PROD-06**
El test asumía que todos los resultados de buscar "phone" tendrían esa palabra en el título pero DummyJSON busca en múltiples campos. Lo detecté en el reporte y decidí dejarlo como error intencional para demostrar análisis en el video.

## Reflexión

Claude redujo el tiempo de setup en un 60-70%. Los problemas en runtime, las decisiones de diseño y el análisis de fallos los resolví revisando trazas y leyendo documentación. La IA acelera el arranque pero el criterio de QA sigue siendo trabajo del ingeniero.