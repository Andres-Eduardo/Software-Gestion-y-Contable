export interface ResultadoFirma {
  xmlFirmado: string;
  esFirmaSimulada: boolean;
}

export interface IFirmadorXml {
  firmar(xmlSinFirmar: string): Promise<ResultadoFirma>;
}
