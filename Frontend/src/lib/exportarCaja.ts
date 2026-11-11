import writeXlsxFile from 'write-excel-file/browser';

export interface MovimientoCaja {
  _id: string;
  fecha: string;
  inicio: string;
  fin: string;
  cancha: string;
  cliente: string;
  telefono: string;
  codigo: string;
  origen: 'online' | 'club';
  medio: string;
  precio: number;
  descuentos: number;
  ingreso: number;
  noShow: boolean;
}

export interface Caja {
  desde: string;
  hasta: string;
  totales: { reservas: number; enLinea: number; enClub: number; total: number; porMedio: Record<string, number> };
  movimientos: MovimientoCaja[];
}

const MEDIO: Record<string, string> = {
  'en línea': 'En línea', efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta',
};
export const nombreMedio = (m: string) => MEDIO[m] ?? m;

const titulo = { fontWeight: 'bold' as const, backgroundColor: '#111827', color: '#ffffff' };
const plata = { format: '#,##0', align: 'right' as const };

/** Descarga la caja como un Excel de verdad (.xlsx): movimientos y resumen. */
export async function exportarCaja(caja: Caja, club = 'Caja') {
  const encabezados = ['Fecha', 'Desde', 'Hasta', 'Cancha', 'Cliente', 'Celular', 'Código', 'Origen', 'Medio de pago', 'Precio', 'Descuentos', 'Te entra', 'No llegó'];
  const movimientos = [
    encabezados.map((value) => ({ value, ...titulo })),
    ...caja.movimientos.map((m) => [
      { value: m.fecha },
      { value: m.inicio },
      { value: m.fin },
      { value: m.cancha },
      { value: m.cliente },
      { value: m.telefono },
      { value: m.codigo },
      { value: m.origen === 'online' ? 'En línea' : 'En el club' },
      { value: nombreMedio(m.medio) },
      { value: m.precio, type: Number, ...plata },
      { value: m.descuentos, type: Number, ...plata },
      { value: m.ingreso, type: Number, ...plata, fontWeight: 'bold' as const },
      { value: m.noShow ? 'Sí' : '' },
    ]),
    [
      { value: 'TOTAL', fontWeight: 'bold' as const }, null, null, null, null, null, null, null, null,
      { value: caja.movimientos.reduce((a, m) => a + m.precio, 0), type: Number, ...plata, fontWeight: 'bold' as const },
      { value: caja.movimientos.reduce((a, m) => a + m.descuentos, 0), type: Number, ...plata, fontWeight: 'bold' as const },
      { value: caja.totales.total, type: Number, ...plata, fontWeight: 'bold' as const },
      null,
    ],
  ];

  const resumen = [
    [{ value: 'Concepto', ...titulo }, { value: 'Valor', ...titulo }],
    [{ value: 'Desde' }, { value: caja.desde }],
    [{ value: 'Hasta' }, { value: caja.hasta }],
    [{ value: 'Reservas' }, { value: caja.totales.reservas, type: Number }],
    [{ value: 'Pagado en línea (ya con descuentos)' }, { value: caja.totales.enLinea, type: Number, ...plata }],
    [{ value: 'Cobrado en el club' }, { value: caja.totales.enClub, type: Number, ...plata }],
    ...Object.entries(caja.totales.porMedio)
      .filter(([medio]) => medio !== 'en línea')
      .map(([medio, valor]) => [{ value: `   ${nombreMedio(medio)}` }, { value: valor, type: Number, ...plata }]),
    [{ value: 'Total', fontWeight: 'bold' as const }, { value: caja.totales.total, type: Number, ...plata, fontWeight: 'bold' as const }],
  ];

  const anchos = [12, 8, 8, 24, 26, 14, 12, 12, 16, 12, 12, 12, 9].map((width) => ({ width }));
  const nombre = `${club.replace(/[\\/:*?"<>|]/g, '').trim() || 'Caja'} ${caja.desde}${caja.hasta !== caja.desde ? ` a ${caja.hasta}` : ''}.xlsx`;

  await writeXlsxFile(
    [
      { data: movimientos, sheet: 'Movimientos', columns: anchos, stickyRowsCount: 1 },
      { data: resumen, sheet: 'Resumen', columns: [{ width: 38 }, { width: 16 }] },
    ],
  ).toFile(nombre);
}
