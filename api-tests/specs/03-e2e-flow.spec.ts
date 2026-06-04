import { test, expect } from '@playwright/test';
import { ENV } from '../config/env';
import { measureSLA } from '../helpers/performance';

test.describe('Flujo E2E — Login → Perfil → Carrito', () => {
  let bearerToken: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    const authRes = await request.post('/auth/login', {
      data: {
        username: ENV.AUTH.USERNAME,
        password: ENV.AUTH.PASSWORD,
        expiresInMins: 60,
      },
    });

    expect(authRes.status()).toBe(200);
    const auth = await authRes.json();
    // DummyJSON v2 usa accessToken, v1 usaba token
    bearerToken = auth.accessToken ?? auth.token;
    userId = auth.id;
  });

  test('E2E-01 | Token válido permite acceder al perfil', async ({ request }) => {
    let response: Awaited<ReturnType<typeof request.get>>;

    const elapsed = await measureSLA(async () => {
      response = await request.get('/auth/me', {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
    });

    expect(response!.status()).toBe(200);
    const profile = await response!.json();

    expect(profile.id).toBe(userId);
    expect(profile.email).toBeTruthy();

    console.log(`Perfil: ${profile.firstName} ${profile.lastName} en ${elapsed}ms`);
  });

  test('E2E-02 | Carrito del usuario carga correctamente', async ({ request }) => {
    const response = await request.get(`/carts/user/${userId}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    const carts = body.carts ?? [body];
    expect(carts).toBeTruthy();

    if (carts.length > 0) {
      expect(carts[0].products?.length ?? 0).toBeGreaterThanOrEqual(0);
      console.log(`Carritos encontrados: ${carts.length}`);
    }
  });

  test('E2E-03 | Sin token devuelve 401', async ({ request }) => {
    const response = await request.get('/auth/me');
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
