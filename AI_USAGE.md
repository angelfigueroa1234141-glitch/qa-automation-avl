# 🤖 Bitácora de Co-Pilotaje con IA

## Herramientas Utilizadas

| Asistente | Rol en el flujo |
|-----------|-----------------|
| **Claude (Anthropic)** | Arquitectura general, generación de boilerplate, revisión de código, redacción de README |
| **GitHub Copilot** | Autocompletado de código TypeScript, sugerencias inline de assertions |
| **ChatGPT-4o** | Investigación rápida de APIs públicas (DummyJSON endpoints, kafkajs patterns) |

---

## Casos de Uso Específicos

### 1. Generación de estructura del proyecto
Claude se usó para diseñar la arquitectura modular del repositorio completa, incluyendo la separación por capas (`mobile-tests/`, `api-tests/`, `event-tests/`) siguiendo el principio de responsabilidad única.

### 2. Esquemas JSON (AJV)
ChatGPT-4o ayudó a generar los JSON Schemas para las respuestas de DummyJSON inspeccionando la documentación de la API y convirtiendo los ejemplos de respuesta al formato draft-07 compatible con AJV.

### 3. Flujos de Maestro (YAML)
GitHub Copilot sugirió la sintaxis correcta de `assertVisible` y `tapOn` con `id` y `index` dentro de los archivos YAML, ahorrando tiempo de búsqueda en la documentación.

### 4. Setup de Kafka con KRaft
Claude orientó la configuración del `docker-compose.yml` para usar Kafka en modo KRaft (sin Zookeeper), que es la forma recomendada en versiones 3.x+ y simplifica el setup local.

### 5. Helper `publishAndConsume`
GitHub Copilot generó el esqueleto de la función asíncrona que combina producer y consumer en un único flujo. Se revisó manualmente el manejo del `setTimeout` y el `clearTimeout` para evitar fugas de memoria.

---

## Prompts Clave

### Prompt 1 — Arquitectura de tests de API con Playwright + AJV

> **Prompt enviado:**
> ```
> Soy QA Engineer preparando una prueba técnica. Necesito una arquitectura
> de tests de API usando @playwright/test (TypeScript) contra DummyJSON.
> Requisitos:
> - JSON Schema validation con AJV
> - SLA de respuesta < 1500ms
> - Helpers reutilizables (schema-validator, performance)
> - Tests separados por archivo: auth, products, e2e-flow
> - Fixtures de datos como constantes, no hardcodeadas en los tests
> Genera la estructura de carpetas y los helpers base.
> ```
>
> **Valor aportado:** Claude generó la estructura `api-tests/helpers/` con los dos helpers (`schema-validator.ts` y `performance.ts`), lo que evitó duplicación de lógica de validación en cada spec. Estimado de tiempo ahorrado: ~45 minutos.

---

### Prompt 2 — Configuración Kafka KRaft con kafkajs

> **Prompt enviado:**
> ```
> Necesito un docker-compose.yml con Kafka en modo KRaft (sin Zookeeper)
> usando bitnami/kafka:3.7 para correr tests de QA localmente.
> También necesito un helper en TypeScript con kafkajs que:
> 1. Cree el tópico si no existe (en beforeAll)
> 2. Implemente publishAndConsume() que conecte producer y consumer
>    en el mismo test, con timeout configurable y limpieza de conexiones.
> El tópico se llama "gps-raw-events".
> ```
>
> **Valor aportado:** El docker-compose generado usó variables de entorno correctas para KRaft (`KAFKA_CFG_PROCESS_ROLES=controller,broker`) que no son triviales de encontrar en la documentación de bitnami. La función `publishAndConsume` fue refinada manualmente para manejar el race condition (suscribir antes de publicar).

---

### Prompt 3 — Flujos Maestro para SauceLabs My Demo App

> **Prompt enviado:**
> ```
> Crea flujos YAML de Maestro CLI para SauceLabs My Demo App (Android).
> App ID: com.saucelabs.mydemoapp.android
> Credenciales: bob@example.com / 10203040
> Flujos necesarios:
> 1. Login exitoso → aserción en "Products"
> 2. Login inválido → aserción en mensaje de error
> 3. Navegación: Login → Producto → Detalle → Back → Menú
> 4. Add to cart: Login → Producto → Add → verificar badge
> Usa selectores por id (no XPath). Incluye takeScreenshot para evidencia.
> ```
>
> **Valor aportado:** Los IDs sugeridos (`nameET`, `passwordET`, `loginBtn`) se verificaron contra el repositorio público de la app. Maestro Studio fue usado para confirmar 2 de los 4 flows; los IDs del carrito (`cartTV`, `cartIV`) requirieron ajuste manual.

---

## Reflexión Técnica

### Impacto en velocidad de entrega
La IA redujo el tiempo de setup inicial en aproximadamente **60-70%**. Tareas que normalmente tomarían 3-4 horas (investigar APIs, escribir boilerplate, configurar Docker) se completaron en ~1 hora.

### Calidad del código
El código generado por IA necesitó refinamiento en tres áreas:
1. **Manejo de errores en Kafka**: La IA generó un `try-catch` genérico; se reemplazó por lógica específica de desconexión en el `finally` para evitar fugas de conexión.
2. **Race conditions**: El helper `publishAndConsume` tenía el producer publicando antes de que el consumer estuviera listo. Se añadió un `setTimeout` de 500ms para garantizar la suscripción previa.
3. **Schema strictness**: Los schemas generados inicialmente tenían `additionalProperties: false` demasiado estricto para DummyJSON, que añade campos extra en algunas respuestas. Se cambió a `true` con `required` explícito.

### Corrección de "alucinaciones"
- **AJV formats**: Claude sugirió `import addFormats from 'ajv-formats'` pero con la versión de importación incorrecta para `ajv-formats@3.x`. Se corrigió consultando la documentación oficial de npm.
- **DummyJSON endpoints**: ChatGPT afirmó que `/auth/me` requería `POST`; en realidad usa `GET`. Se verificó con la documentación de DummyJSON antes de escribir el test.

### Criterio de ingeniería aplicado
La IA fue un acelerador, no un reemplazo del criterio técnico. Cada sugerencia fue evaluada contra:
- ¿Es idiomático en TypeScript/Node.js?
- ¿Genera acoplamiento innecesario?
- ¿El test podría ser flaky?

El diseño final de `validateSchema()` como helper centralizado (en lugar de instanciar `Ajv` en cada spec) fue una decisión tomada manualmente para garantizar rendimiento y coherencia.
