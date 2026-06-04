# 🚀 QA Automation Suite — AVL Mobility Solutions

Suite de automatización de pruebas para la plataforma de Telemetría, Monitoreo IoT y Movilidad.

[![API Tests](https://img.shields.io/badge/Playwright-API%20Tests-green)](https://playwright.dev)
[![Mobile Tests](https://img.shields.io/badge/Maestro-Mobile%20Tests-blue)](https://maestro.mobile.dev)
[![Kafka Events](https://img.shields.io/badge/kafkajs-Event%20Tests-orange)](https://kafka.js.org)

---

## 📐 Arquitectura de la Suite

```
qa-automation-avl/
├── mobile-tests/           # 📱 Pruebas móviles con Maestro CLI (YAML)
│   └── flows/
│       ├── 01-login-success.yaml
│       ├── 02-login-invalid.yaml
│       ├── 03-navigation.yaml
│       └── 04-add-to-cart.yaml
│
├── api-tests/              # 🌐 Pruebas de API con Playwright (TypeScript)
│   ├── config/env.ts       # Variables de entorno centralizadas
│   ├── schemas/            # JSON Schemas para validación de contratos
│   ├── helpers/            # Utilidades reutilizables (schema, SLA)
│   └── specs/
│       ├── 01-auth.spec.ts         # Autenticación (4 casos)
│       ├── 02-products.spec.ts     # CRUD Productos (7 casos)
│       └── 03-e2e-flow.spec.ts     # Flujo integrado Login→Perfil→Carrito
│
├── event-tests/            # 📡 Pruebas de Kafka (bonus)
│   ├── config/kafka.config.ts
│   ├── helpers/telemetry-schemas.ts
│   └── specs/01-telemetry.e2e.spec.ts
│
├── docker-compose.yml      # Kafka local (KRaft, sin Zookeeper)
├── playwright.config.ts    # Config para API tests
├── playwright.kafka.config.ts
└── AI_USAGE.md             # Bitácora de co-pilotaje con IA
```

### Decisiones de arquitectura
| Decisión | Justificación |
|----------|--------------|
| **Maestro CLI** (mobile) | Setup mínimo, YAML declarativo, sin servidor Appium |
| **Playwright API** | Runner + assertions + reporte HTML en un solo paquete |
| **AJV** para schemas | Estándar de industria, soporte JSON Schema draft-07 |
| **kafkajs** | Cliente oficial de Kafka para Node.js, bien mantenido |
| **KRaft** (sin Zookeeper) | Docker compose más simple, Kafka 3.x recomendado |
| **DummyJSON** | API pública con auth JWT real, CRUD simulado, schemas estables |

---

## ✅ Casos de prueba implementados

### 📱 Mobile (Maestro) — 4 flujos
| ID | Escenario | Tipo |
|----|-----------|------|
| TC-MOB-01 | Login exitoso con credenciales válidas | Happy path |
| TC-MOB-02 | Login fallido con credenciales inválidas | Negativo |
| TC-MOB-03 | Navegación: Catálogo → Detalle → Menú | Navegación |
| TC-MOB-04 | Agregar producto al carrito + verificar badge | Estado UI |

### 🌐 API (Playwright) — 14 casos
| ID | Escenario | Endpoint |
|----|-----------|----------|
| TC-AUTH-01 | Login exitoso + schema JWT | POST /auth/login |
| TC-AUTH-02 | Credenciales inválidas → 400 | POST /auth/login |
| TC-AUTH-03 | Payload vacío → 4xx | POST /auth/login |
| TC-AUTH-04 | JWT tiene 3 partes (header.payload.sig) | POST /auth/login |
| TC-PROD-01 | Listar productos con schema válido | GET /products |
| TC-PROD-02 | Obtener producto por ID + schema | GET /products/1 |
| TC-PROD-03 | Crear producto → 201 + schema | POST /products/add |
| TC-PROD-04 | Actualizar producto → 200 + campos | PUT /products/1 |
| TC-PROD-05 | ID inexistente → 404 | GET /products/99999 |
| TC-PROD-06 | Búsqueda filtra correctamente | GET /products/search |
| TC-PROD-07 | Paginación con limit=5 | GET /products?limit=5 |
| E2E-01 | Token válido permite ver perfil | GET /auth/me |
| E2E-02 | Carrito del usuario cargado | GET /carts/user/:id |
| E2E-03 | Sin token → 401 Unauthorized | GET /auth/me |

### 📡 Kafka (bonus) — 5 casos
| ID | Escenario |
|----|-----------|
| TC-KAFKA-01 | Publicar evento GPS → consumir íntegro con schema válido |
| TC-KAFKA-02 | Batch de 5 eventos de flota → sin errores |
| TC-KAFKA-03 | Schema acepta evento mínimo |
| TC-KAFKA-04 | Schema rechaza velocidad negativa |
| TC-KAFKA-05 | Schema rechaza coordenadas fuera de rango |

---

## ⚙️ Prerrequisitos

### Node.js y npm
```bash
node -v    # Requiere v18.0.0 o superior
npm -v     # Requiere v9.0.0 o superior
```

### Para pruebas móviles — Maestro CLI
```bash
# macOS / Linux
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"
maestro --version    # Verificar instalación

# Android (requiere Android SDK)
export ANDROID_HOME=$HOME/Library/Android/sdk     # macOS
export ANDROID_HOME=$HOME/Android/Sdk             # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verificar dispositivo/emulador conectado
adb devices
```

### Para pruebas Kafka (opcional, bonus)
```bash
docker --version    # Docker Desktop o Docker Engine
docker compose version
```

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/qa-automation-avl.git
cd qa-automation-avl

# 2. Instalar dependencias de Node.js
npm install

# 3. Instalar navegadores de Playwright (solo para API tests)
npx playwright install chromium
```

---

## ▶️ Ejecutar las pruebas

### 🌐 API Tests (Playwright)

```bash
# Correr todos los tests de API
npm run test:api

# Ver reporte HTML interactivo
npm run test:api:report

# Correr una suite específica
npx playwright test api-tests/specs/01-auth.spec.ts

# Correr con output verbose
npm run test:api:headed
```

### 📱 Mobile Tests (Maestro)

```bash
# Pre-condición: tener emulador corriendo o dispositivo conectado
# Descargar APK: https://github.com/saucelabs/my-demo-app-android/releases/latest

# Instalar APK en el emulador
adb install saucelabs-my-demo-app.apk

# Correr un flujo individual
npm run mobile:login
npm run mobile:login-fail
npm run mobile:navigation
npm run mobile:cart

# Correr todos los flujos
npm run mobile:all

# Grabación en video (Maestro Studio)
maestro studio
```

### 📡 Kafka Tests (bonus)

```bash
# 1. Levantar el broker Kafka local
npm run kafka:up

# 2. Verificar que Kafka está saludable
npm run kafka:topics

# 3. (Opcional) Ver la UI de Kafka en el browser
open http://localhost:8080

# 4. Correr los tests de eventos
npm run test:kafka

# 5. Bajar el broker
npm run kafka:down
```

### 🔄 Correr todo junto

```bash
# API + Kafka (mobile requiere dispositivo conectado)
npm run test:all
```

---

## 🌍 Variables de entorno

Crea un archivo `.env` en la raíz (no se sube al repo):

```bash
# API
API_BASE_URL=https://dummyjson.com   # default
TEST_USERNAME=emilys
TEST_PASSWORD=emilyspass
SLA_MS=1500

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=gps-raw-events
```

---

## 📊 Reportes

Después de correr `npm run test:api`:

```
reports/
├── api/
│   ├── index.html      ← Abrir en browser para reporte visual
│   └── results.json    ← Para integración CI/CD
└── kafka/
    └── index.html
```

```bash
# Ver reporte de API
npm run test:api:report

# Ver reporte de Kafka
npx playwright show-report reports/kafka
```

---

## 🏃 Integración CI/CD (GitHub Actions)

El workflow `.github/workflows/api-tests.yml` corre automáticamente en cada PR.

```bash
# Verificar que el workflow está activo
cat .github/workflows/api-tests.yml
```

---

## 🧠 Estrategia de Priorización (Risk-Based Testing)

La priorización se hizo según **impacto en el negocio × probabilidad de fallo**:

| Prioridad | Capa | Razón |
|-----------|------|-------|
| 🔴 Alta | Autenticación | Puerta de entrada a toda la plataforma |
| 🔴 Alta | Ingesta de eventos (Kafka) | Pérdida de telemetría = datos de flota corruptos |
| 🟡 Media | CRUD de Productos | Impacto directo en transacciones |
| 🟡 Media | Login móvil | Primer punto de contacto del usuario |
| 🟢 Baja | Paginación/búsqueda | Fácil de detectar, bajo impacto crítico |

---

## 🔧 Troubleshooting

**Error: `Cannot find module 'ajv-formats'`**
```bash
npm install ajv-formats
```

**Maestro: `No connected devices`**
```bash
# Verificar emulador
adb devices
# Si está offline:
adb kill-server && adb start-server
```

**Kafka: `Connection timeout`**
```bash
# Verificar que el contenedor está corriendo
docker ps | grep qa-kafka
# Ver logs del broker
docker logs qa-kafka --tail 50
```

**Playwright: `browserType.launch: Executable doesn't exist`**
```bash
npx playwright install
```

---

## 👤 Autor

Construido con 🧪 + IA para AVL Mobility Solutions — Prueba Técnica QA Automation Engineer.

Ver [AI_USAGE.md](./AI_USAGE.md) para la bitácora completa de co-pilotaje.
