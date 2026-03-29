export type ChangelogTag = 'nueva_funcion' | 'mejora' | 'correccion' | 'importante' | 'mantenimiento';

export interface Changelog {
  _id: string;
  titulo: string;
  descripcion: string;
  version?: string;
  tag: ChangelogTag;
  destinatarios: string;
  createdAt: string;
}
