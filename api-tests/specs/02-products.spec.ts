import { test, expect, APIRequestContext } from '@playwright/test';
import { validateSchema } from '../helpers/schema-validator';
import { measureSLA } from '../helpers/performance';
import productSchema from '../schemas/product.schema.json';
import productsListSchema from '../schemas/products-list.schema.json';

const NEW_PRODUCT = {
  title: 'AVL Telemetry Unit v2',
  description: 'Dispositivo de rastreo GPS para flotas vehiculares',
  price: 299.99,
  stock: 50,
  rating: 4.8,
  brand: 'AVL Mobility',
  category: 'telematics',
  thumbnail: 'https://example.com/avn-unit-v2.png',
};

const UPDATED_FIELDS = {
  title: 'AVL Telemetry Unit v2 — Updated',
  price: 249.99,
  stock: 75,
};

test.describe('Productos — CRUD + Contratos + SLA', () => {

  test('TC-PROD-01 | GET /products devuelve lista con schema válido', async ({ request }) => {
    let response: Awaited<ReturnType<APIRequestContext['get']>>;

    const elapsed = await measureSLA(async () => {
      response = await request.get('/products?limit=10&skip=0');
    });

    expect(response!.status()).toBe(200);

    const body = await response!.json();
    validateSchema(productsListSchema, body, 'ProductsListResponse');

    expect(body.products.length).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);

    console.log(`${body.products.length} productos de ${body.total} en ${elapsed}ms`);
  });

  test('TC-PROD-02 | GET /products/1 devuelve producto con schema válido', async ({ request }) => {
    let response: Awaited<ReturnType<APIRequestContext['get']>>;

    const elapsed = await measureSLA(async () => {
      response = await request.get('/products/1');
    });

    expect(response!.status()).toBe(200);

    const body = await response!.json();
    validateSchema(productSchema, body, 'ProductResponse');

    expect(typeof body.id).toBe('number');
    expect(body.price).toBeGreaterThan(0);
    expect(body.stock).toBeGreaterThanOrEqual(0);

    console.log(`"${body.title}" — $${body.price} en ${elapsed}ms`);
  });

  test('TC-PROD-03 | POST /products/add crea producto y devuelve 201', async ({ request }) => {
    let response: Awaited<ReturnType<APIRequestContext['post']>>;

    const elapsed = await measureSLA(async () => {
      response = await request.post('/products/add', {
        data: NEW_PRODUCT,
      });
    });

    expect(response!.status()).toBe(201);

    const body = await response!.json();
    validateSchema(productSchema, body, 'CreatedProductResponse');

    expect(body.id).toBeGreaterThan(0);
    expect(body.title).toBe(NEW_PRODUCT.title);
    expect(body.price).toBe(NEW_PRODUCT.price);
    expect(body.brand).toBe(NEW_PRODUCT.brand);

    console.log(`Producto creado con ID ${body.id} en ${elapsed}ms`);
  });

  test('TC-PROD-04 | PUT /products/1 actualiza y devuelve campos modificados', async ({ request }) => {
    let response: Awaited<ReturnType<APIRequestContext['put']>>;

    const elapsed = await measureSLA(async () => {
      response = await request.put('/products/1', {
        data: UPDATED_FIELDS,
      });
    });

    expect(response!.status()).toBe(200);

    const body = await response!.json();
    validateSchema(productSchema, body, 'UpdatedProductResponse');

    expect(body.title).toBe(UPDATED_FIELDS.title);
    expect(body.price).toBe(UPDATED_FIELDS.price);
    expect(body.stock).toBe(UPDATED_FIELDS.stock);
    expect(body.id).toBe(1);

    console.log(`Producto actualizado: "${body.title}" en ${elapsed}ms`);
  });

  test('TC-PROD-05 | GET /products/99999 devuelve 404 para ID inexistente', async ({ request }) => {
    const response = await request.get('/products/99999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message ?? body.error).toBeTruthy();
  });

  test('TC-PROD-06 | GET /products/search?q= filtra resultados por título', async ({ request }) => {
    const response = await request.get('/products/search?q=phone');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.products.length).toBeGreaterThan(0);

    // Todos los resultados deben contener el término en el título
    body.products.forEach((p: { title: string }) => {
      expect(p.title.toLowerCase()).toContain('phone');
    });

    console.log(`${body.products.length} productos encontrados con "phone"`);
  });

  test('TC-PROD-07 | GET /products con limit=5 devuelve exactamente 5 items', async ({ request }) => {
    const LIMIT = 5;
    const response = await request.get(`/products?limit=${LIMIT}&skip=0`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.products).toHaveLength(LIMIT);
    expect(body.limit).toBe(LIMIT);
    expect(body.skip).toBe(0);
  });
});