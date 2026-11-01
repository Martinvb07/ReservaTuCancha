import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Mensajes de WhatsApp con la API de WhatsApp Cloud (Meta).
 *
 * Fuera de una conversación abierta por el cliente, Meta solo deja mandar
 * plantillas aprobadas. La del recordatorio se crea en el WhatsApp Manager con
 * cinco variables en el cuerpo, en este orden:
 *
 *   {{1}} nombre del jugador   {{2}} cancha   {{3}} fecha
 *   {{4}} horario              {{5}} código de la reserva
 *
 * Ejemplo: "Hola {{1}}, te recordamos tu reserva en {{2}} el {{3}} de {{4}}.
 * Código: {{5}}. ¿No puedes ir? Cambia el horario desde el correo."
 *
 * Variables: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y, opcionales,
 * WHATSAPP_TEMPLATE_RECORDATORIO (por defecto "recordatorio_reserva") y
 * WHATSAPP_TEMPLATE_IDIOMA (por defecto "es"). Sin token queda apagado.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  get activo(): boolean {
    return !!(this.config.get('WHATSAPP_TOKEN') && this.config.get('WHATSAPP_PHONE_NUMBER_ID'));
  }

  /**
   * Número en formato internacional sin "+", como lo pide Meta. Los celulares
   * colombianos se escriben casi siempre sin indicativo (3001234567).
   */
  static normalizarTelefono(crudo?: string | null): string | null {
    if (!crudo) return null;
    let digitos = String(crudo).replace(/\D/g, '');
    if (digitos.startsWith('00')) digitos = digitos.slice(2);
    if (digitos.length === 10 && digitos.startsWith('3')) digitos = `57${digitos}`;
    if (digitos.length < 11 || digitos.length > 15) return null;
    return digitos;
  }

  async enviarPlantilla(telefono: string | null | undefined, plantilla: string, variables: string[]): Promise<boolean> {
    const destino = WhatsappService.normalizarTelefono(telefono);
    if (!this.activo || !destino) return false;

    const version = this.config.get<string>('WHATSAPP_API_VERSION') || 'v21.0';
    const phoneId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    try {
      const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.get<string>('WHATSAPP_TOKEN')}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: destino,
          type: 'template',
          template: {
            name: plantilla,
            language: { code: this.config.get<string>('WHATSAPP_TEMPLATE_IDIOMA') || 'es' },
            components: [{
              type: 'body',
              // Meta rechaza variables vacías o con saltos de línea.
              parameters: variables.map((v) => ({
                type: 'text',
                text: String(v || '-').replace(/\s+/g, ' ').slice(0, 200),
              })),
            }],
          },
        }),
      });
      if (!res.ok) {
        const json: any = await res.json().catch(() => null);
        this.logger.warn(`WhatsApp rechazó el mensaje: HTTP ${res.status} ${json?.error?.message ?? ''}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`WhatsApp no enviado: ${e.message}`);
      return false;
    }
  }

  recordatorio(telefono: string | undefined, v: { nombre: string; cancha: string; fecha: string; horario: string; codigo: string }) {
    const plantilla = this.config.get<string>('WHATSAPP_TEMPLATE_RECORDATORIO') || 'recordatorio_reserva';
    return this.enviarPlantilla(telefono, plantilla, [v.nombre, v.cancha, v.fecha, v.horario, v.codigo]);
  }
}
