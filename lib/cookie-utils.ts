import { createHmac } from 'crypto';

/**
 * Firma un valor usando HMAC-SHA256
 */
export function signCookie(value: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(value);
  return `${value}.${hmac.digest('hex').slice(0, 16)}`;
}

/**
 * Verifica una cookie firmada
 * Retorna el valor original si es válido, o null si es inválido
 */
export function verifySignedCookie(signedValue: string, secret: string): string | null {
  try {
    const [value, signature] = signedValue.split('.');
    if (!value || !signature) return null;

    const expectedSignature = createHmac('sha256', secret)
      .update(value)
      .digest('hex')
      .slice(0, 16);

    if (signature !== expectedSignature) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}