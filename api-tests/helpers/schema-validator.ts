import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { expect } from '@playwright/test';

// Instancia única con formatos extendidos (email, uri, etc.)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Valida un cuerpo de respuesta contra un JSON Schema.
 * Falla el test con un mensaje descriptivo si hay violaciones.
 *
 * @param schema  - JSON Schema object importado
 * @param body    - Cuerpo de respuesta parseado
 * @param label   - Etiqueta para el mensaje de error
 */
export function validateSchema(
  schema: object,
  body: unknown,
  label = 'Response'
): void {
  const validate = ajv.compile(schema);
  const valid = validate(body);

  if (!valid) {
    const errors = validate.errors
      ?.map((e) => `  • ${e.instancePath || '(root)'} ${e.message}`)
      .join('\n');
    throw new Error(`[Schema Violation] ${label}:\n${errors}`);
  }

  // Si llegamos aquí, el schema es válido
  expect(valid).toBe(true);
}
