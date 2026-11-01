import { ConfigService } from '@nestjs/config';

/** ConfigService de mentira: lee de un objeto en vez del entorno. */
export const configCon = (valores: Record<string, unknown> = {}): ConfigService =>
  ({ get: (clave: string) => valores[clave] }) as unknown as ConfigService;
