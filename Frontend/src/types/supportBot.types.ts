/** Acciones especiales que no navegan a otro nodo del árbol. */
export type SupportBotAccion = 'whatsapp';

export interface SupportBotOpcion {
  texto: string;
  /** Id del siguiente nodo dentro de `nodos`. */
  destino?: string;
  /** Enlace interno (/canchas), externo o mailto:. */
  url?: string;
  accion?: SupportBotAccion;
}

export interface SupportBotNodo {
  mensaje: string;
  opciones: SupportBotOpcion[];
  /** Nodo hoja: el widget le agrega solas las `opcionesFinales`. */
  esRespuesta?: boolean;
}

export interface SupportBotTree {
  meta: {
    titulo: string;
    subtitulo: string;
    saludo: string;
    nodoInicial: string;
    opcionesFinales: SupportBotOpcion[];
  };
  nodos: Record<string, SupportBotNodo>;
}

/** Cada burbuja que se pinta en la conversación. */
export interface SupportBotMensaje {
  id: string;
  autor: 'bot' | 'usuario';
  texto: string;
}
