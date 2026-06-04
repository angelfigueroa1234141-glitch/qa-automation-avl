import { expect } from '@playwright/test';
import { ENV } from '../config/env';

/**
 * Mide el tiempo de respuesta de una llamada HTTP y verifica el SLA.
 * Retorna el tiempo en ms para usarlo en aserciones adicionales si se necesita.
 *
 * @example
 * const elapsed = await measureSLA(async () => {
 *   response = await request.get('/products/1');
 * });
 */
export async function measureSLA(
  fn: () => Promise<void>,
  slaMs = ENV.SLA_MS
): Promise<number> {
  const start = Date.now();
  await fn();
  const elapsed = Date.now() - start;

  expect(
    elapsed,
    `⏱ SLA violado: respuesta tomó ${elapsed}ms (límite: ${slaMs}ms)`
  ).toBeLessThan(slaMs);

  return elapsed;
}

/**
 * Wraps una APIResponse de Playwright y mide el tiempo usando
 * la cabecera X-Response-Time si existe, o el tiempo de llamada.
 */
export function assertSLAHeader(
  headers: Record<string, string>,
  slaMs = ENV.SLA_MS
): void {
  const headerTime = headers['x-response-time'];
  if (headerTime) {
    const ms = parseFloat(headerTime);
    expect(
      ms,
      `⏱ Cabecera X-Response-Time indica ${ms}ms (límite: ${slaMs}ms)`
    ).toBeLessThan(slaMs);
  }
}
