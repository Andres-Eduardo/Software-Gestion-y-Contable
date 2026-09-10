export interface PayloadCanonico {
  emisor: EmisorPayload;
  adquirente: AdquirentePayload;
  documento: DocumentoPayload;
  items: ItemPayload[];
  totales: TotalesPayload;
  formaPago: FormaPagoPayload;
}

export interface EmisorPayload {
  nit: string;
  dv: number;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  paisCodigo: string;
  responsableIva: boolean;
  responsableInc: boolean;
}

export interface AdquirentePayload {
  tipoDocumento: "CC" | "NIT" | "CE" | "PASAPORTE";
  numeroDocumento: string;
  dv?: number;
  tipoPersona: "NATURAL" | "JURIDICA";
  nombreCompleto: string;
  direccion?: string;
  paisCodigo: string;
}

export interface DocumentoPayload {
  tipoDocumento: "FACTURA_VENTA" | "NOTA_CREDITO" | "NOTA_DEBITO";

  prefijo: string;
  numero: number;
  fechaEmision: string;
  horaEmision: string;
  moneda: string;
}

export interface ItemPayload {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  impuestos: ImpuestoItemPayload[];
  total: number;
}

export interface ImpuestoItemPayload {
  tipo: "IVA" | "INC";
  porcentaje: number;
  valor: number;
}

export interface TotalesPayload {
  subtotal: number;
  totalDescuento: number;
  totalIva: number;
  totalInc: number;
  total: number;
}

export interface FormaPagoPayload {
  tipo: "CONTADO" | "CREDITO";
  medios: MedioPagoPayload[];
}

export interface MedioPagoPayload {
  codigo: string;
  monto: number;
  referencia?: string;
}
