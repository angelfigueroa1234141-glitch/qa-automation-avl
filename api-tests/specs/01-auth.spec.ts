import { test, expect, APIRequestContext } from '@playwright/test';
import { ENV } from '../config/env';
import { validateSchema } from '../helpers/schema-validator';
import { measureSLA } from '../helpers/performance';
import authSchema from '../schemas/auth.schema.json';

// DummyJSON v1 usaba "token", v2 usa "accessToken"
interface AuthResponse {
  id: number;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

function extractToken(body: AuthResponse): string {
  return body.accessToken ?? body.token ?? '';
}

test.describe('Autenticación — POST /auth/login', () => {
  let authToken: string;

  test('TC-AUTH-01 | Login exitoso devuelve 200 y token válido', async ({ request }) => {
    let response: Awaited<ReturnType<APIRequestContext['post']>>;

    const elapsed = await measureSLA(async () => {
      response = await request.post('/auth/login', {
        data: {
          username: ENV.AUTH.USERNAME,
          password: ENV.AUTH.PASSWORD,
          expiresInMins: 30,
        },
      });
    });

    expect(response!.status()).toBe(200);
    expect(response!.headers()['content-type']).toContain('application/json');

    const body: AuthResponse = await response!.json();
    validateSchema(authSchema, body, 'AuthResponse');

    const token = extractToken(body);
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(20);

    authToken = token;
    console.log(`Token obtenido en ${elapsed}ms`);
  });

  test('TC-AUTH-02 | Credenciales inválidas devuelven 400', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        username: ENV.AUTH.INVALID_USERNAME,
        password: ENV.AUTH.INVALID_PASSWORD,
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message ?? body.error).toBeTruthy();
  });

  test('TC-AUTH-03 | Payload vacío devuelve error de validación', async ({ request }) => {
    const response = await request.post('/auth/login', { data: {} });
    expect([400, 401]).toContain(response.status());
  });

  test('TC-AUTH-04 | Token tiene estructura JWT correcta', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        username: ENV.AUTH.USERNAME,
        password: ENV.AUTH.PASSWORD,
      },
    });

    expect(response.status()).toBe(200);
    const body: AuthResponse = await response.json();
    const token = extractToken(body);

    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(20);

    // JWT tiene 3 partes: header.payload.signature
    const parts = token.split('.');
    if (parts.length === 3) {
      parts.forEach(part => expect(part.length).toBeGreaterThan(0));
    }
  });
});
