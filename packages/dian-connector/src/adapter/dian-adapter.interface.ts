export interface RespuestaEnvioDian {
  aceptado: boolean;
  cufe?: string;
  mensaje: string;
  trackId?: string;
}

export interface IDianAdapter {
  enviarDocumento(
    xmlFirmado: string,
    cufe: string,
  ): Promise<RespuestaEnvioDian>;
  consultarEstado(trackId: string): Promise<RespuestaEnvioDian>;
}
