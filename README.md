# QA Automation Suite — AVL Mobility Solutions

Suite de automatización de pruebas para la plataforma de Telemetría, Monitoreo IoT y Movilidad.

## Estructura del proyecto

```
qa-automation-avl/
├── mobile-tests/
│   └── flows/
│       ├── 01-login-success.yaml
│       ├── 02-login-invalid.yaml
│       ├── 03-navigation.yaml
│       └── 04-add-to-cart.yaml
├── api-tests/
│   ├── config/env.ts
│   ├── schemas/
│   ├── helpers/
│   └── specs/
│       ├── 01-auth.spec.ts
│       ├── 02-products.spec.ts
│       └── 03-e2e-flow.spec.ts
├── event-tests/
│   ├── config/kafka.config.ts
│   ├── helpers/telemetry-schemas.ts
│   └── specs/01-telemetry.e2e.spec.ts
├── docker-compose.yml
├── playwright.config.ts
└── playwright.kafka.config.ts
```

## Stack

- Mobile: Maestro CLI — sin servidor Appium, flujos en YAML
- API: Playwright (TypeScript) + AJV para validación de contratos
- Kafka: kafkajs + Docker Compose en modo KRaft (sin Zookeeper)
- API bajo prueba: DummyJSON

## Prerrequisitos

```bash
node -v   # v18 o superior
npm -v    # v9 o superior
```

Para mobile:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
adb devices   # verificar emulador conectado
```

Para Kafka:
```bash
docker --version
docker compose version
```

## Instalación

```bash
git clone https://github.com/angelfigueroa1234141-glitch/qa-automation-avl.git
cd qa-automation-avl
npm install
npx playwright install chromium
```

## Ejecutar pruebas

API:
```bash
npm run test:api
npm run test:api:report
```

Mobile:
```bash
adb install saucelabs-my-demo-app.apk
npm run mobile:all
```

Kafka:
```bash
npm run kafka:up
npm run test:kafka
npm run kafka:down
```

## Variables de entorno

```bash
API_BASE_URL=https://dummyjson.com
TEST_USERNAME=emilys
TEST_PASSWORD=emilyspass
SLA_MS=3000
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=gps-raw-events
```

## Casos de prueba

Mobile (Maestro): 4 flujos — login exitoso, login inválido, navegación, agregar al carrito.

API (Playwright): 14 casos — autenticación (4), productos CRUD (7), flujo E2E (3).

Kafka (bonus): 5 casos — publicar/consumir evento, batch de flota, validaciones de schema.

## Troubleshooting

```bash
# Módulo no encontrado
npm install

# Emulador no detectado
adb kill-server && adb start-server

# Kafka sin conexión
docker ps | grep qa-kafka
docker logs qa-kafka --tail 50

# Playwright sin navegador
npx playwright install
```