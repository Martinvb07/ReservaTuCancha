/**
 * Un modelo de Mongoose de mentira, en memoria, con lo justo para probar los
 * servicios: find/findOne/findById con select/populate/sort/lean, updates,
 * borrados y `new Modelo(doc).save()`. Los filtros entienden igualdad, $in,
 * $ne, $gte, $gt, $lte, $lt y $exists.
 */
import { Types } from 'mongoose';

const igual = (a: any, b: any) => {
  if (a instanceof Date || b instanceof Date) return new Date(a).getTime() === new Date(b).getTime();
  return String(a) === String(b);
};
const num = (v: any) => (v instanceof Date ? v.getTime() : typeof v === 'number' ? v : new Date(v).getTime());

function cumple(doc: any, filtro: any): boolean {
  return Object.entries(filtro ?? {}).every(([campo, cond]: [string, any]) => {
    const valor = campo.split('.').reduce((o, k) => o?.[k], doc);
    if (cond && typeof cond === 'object' && !(cond instanceof Date) && !(cond instanceof Types.ObjectId)
      && Object.keys(cond).some((k) => k.startsWith('$'))) {
      return Object.entries(cond).every(([op, v]: [string, any]) => {
        switch (op) {
          case '$in': return (v as any[]).some((x) => igual(valor, x));
          case '$ne': return valor === undefined ? v !== undefined : !igual(valor, v);
          case '$gte': return valor !== undefined && num(valor) >= num(v);
          case '$gt': return valor !== undefined && num(valor) > num(v);
          case '$lte': return valor !== undefined && num(valor) <= num(v);
          case '$lt': return valor !== undefined && num(valor) < num(v);
          case '$exists': return (valor !== undefined) === v;
          default: throw new Error(`Operador no soportado: ${op}`);
        }
      });
    }
    return valor !== undefined && igual(valor, cond);
  });
}

export function modeloEnMemoria(opciones: { poblar?: Record<string, () => any[]> } = {}) {
  const docs: any[] = [];

  const envolver = (d: any) => {
    if (!d) return d;
    Object.defineProperties(d, {
      save: { value: async () => d, enumerable: false, configurable: true },
      toObject: { value: () => ({ ...d }), enumerable: false, configurable: true },
      deleteOne: { value: async () => { docs.splice(docs.indexOf(d), 1); }, enumerable: false, configurable: true },
    });
    return d;
  };

  const consulta = (resolver: () => any) => {
    let poblar: string | undefined;
    let orden: Record<string, number> | undefined;
    let tope: number | undefined;
    const q: any = {
      select: () => q,
      lean: () => q,
      exec: () => q.then((x: any) => x),
      populate: (campo: string) => { poblar = campo; return q; },
      sort: (o: Record<string, number>) => { orden = o; return q; },
      limit: (n: number) => { tope = n; return q; },
      skip: () => q,
      then: (ok: any, mal: any) => {
        try {
          let r = resolver();
          const unir = (d: any) => {
            if (!d || !poblar || !opciones.poblar?.[poblar]) return d;
            const rel = opciones.poblar[poblar]().find((x) => igual(x._id, d[poblar!]));
            return rel ? Object.assign(Object.create(Object.getPrototypeOf(d)), d, { [poblar]: rel }) : d;
          };
          if (Array.isArray(r)) {
            if (orden) {
              const [[k, dir]] = Object.entries(orden);
              r = [...r].sort((a, b) => (num(a[k]) - num(b[k])) * dir);
            }
            if (tope) r = r.slice(0, tope);
            r = r.map(unir);
          } else r = unir(r);
          return Promise.resolve(r).then(ok, mal);
        } catch (e) {
          return Promise.reject(e).then(ok, mal);
        }
      },
    };
    return q;
  };

  const aplicar = (d: any, cambio: any) => Object.assign(d, cambio.$set ?? cambio);

  function Modelo(this: any, datos: any) {
    const d = envolver({ _id: new Types.ObjectId(), createdAt: new Date(), ...datos });
    Object.defineProperty(d, 'save', {
      value: async () => { if (!docs.includes(d)) docs.push(d); return d; },
      enumerable: false,
    });
    return d;
  }
  Object.assign(Modelo, {
    docs,
    find: (f: any) => consulta(() => docs.filter((d) => cumple(d, f))),
    findOne: (f: any) => consulta(() => docs.find((d) => cumple(d, f)) ?? null),
    findById: (id: any) => consulta(() => docs.find((d) => igual(d._id, id)) ?? null),
    findByIdAndUpdate: (id: any, cambio: any) =>
      consulta(() => { const d = docs.find((x) => igual(x._id, id)); return d ? aplicar(d, cambio) : null; }),
    updateOne: async (f: any, cambio: any, opts: any = {}) => {
      const d = docs.find((x) => cumple(x, f));
      if (d) aplicar(d, cambio);
      else if (opts.upsert) {
        const igualdades = Object.fromEntries(Object.entries(f).filter(([, v]) => !(v && typeof v === 'object' && !(v instanceof Types.ObjectId) && !(v instanceof Date))));
        await (Modelo as any).create({ ...igualdades, ...(cambio.$set ?? cambio) });
      }
    },
    updateMany: async (f: any, cambio: any) => { docs.filter((x) => cumple(x, f)).forEach((d) => aplicar(d, cambio)); },
    deleteMany: async (f: any) => {
      const fuera = docs.filter((d) => cumple(d, f));
      fuera.forEach((d) => docs.splice(docs.indexOf(d), 1));
      return { deletedCount: fuera.length };
    },
    findByIdAndDelete: async (id: any) => { const i = docs.findIndex((d) => igual(d._id, id)); if (i >= 0) docs.splice(i, 1); },
    exists: async (f: any) => (docs.some((d) => cumple(d, f)) ? { _id: 1 } : null),
    countDocuments: async (f: any) => docs.filter((d) => cumple(d, f)).length,
    create: async (datos: any) => { const d = new (Modelo as any)(datos); await d.save(); return d; },
  });
  return Modelo as any;
}
