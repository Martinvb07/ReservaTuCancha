import { WhatsappService } from './whatsapp.service';
import { configCon } from '../../test-utils/config';

describe('WhatsappService', () => {
  it.each([
    ['3001234567', '573001234567'],
    ['300 123 4567', '573001234567'],
    ['+57 300 123 4567', '573001234567'],
    ['0057 3001234567', '573001234567'],
    ['+1 (415) 555-0100', '14155550100'],
    ['12345', null],
    ['', null],
    [undefined, null],
  ])('normaliza %p como %p', (entrada, esperado) => {
    expect(WhatsappService.normalizarTelefono(entrada as any)).toBe(esperado);
  });

  it('sin credenciales no intenta enviar', async () => {
    const fetch = jest.spyOn(global, 'fetch' as any);
    const w = new WhatsappService(configCon());
    expect(w.activo).toBe(false);
    expect(await w.recordatorio('3001234567', { nombre: 'Ana', cancha: 'C1', fecha: 'mañana', horario: '7 pm', codigo: 'X' })).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });

  it('manda la plantilla con las cinco variables en orden', async () => {
    const fetch = jest.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    const w = new WhatsappService(configCon({ WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '99' }));
    await w.recordatorio('3001234567', { nombre: 'Ana', cancha: 'C1', fecha: 'mañana', horario: '7:00 pm', codigo: 'ABC' });
    const [url, init] = fetch.mock.calls[0] as any[];
    expect(url).toBe('https://graph.facebook.com/v21.0/99/messages');
    const body = JSON.parse(init.body);
    expect(body.to).toBe('573001234567');
    expect(body.template.name).toBe('recordatorio_reserva');
    expect(body.template.components[0].parameters.map((p: any) => p.text)).toEqual(['Ana', 'C1', 'mañana', '7:00 pm', 'ABC']);
    fetch.mockRestore();
  });
});
