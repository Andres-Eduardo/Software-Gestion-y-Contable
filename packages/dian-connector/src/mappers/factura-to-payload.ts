import type {
  Factura,
  DetalleFactura,
  PagoFactura,
  Empresa,
  Tercero,
} from "db";
import type {
  PayloadCanonico,
  ItemPayload,
  MedioPagoPayload,
  AdquirentePayload,
} from "../types/payload-canonico.js";

// Códigos de medio de pago DIAN — PENDIENTES DE VALIDAR contra el Anexo Técnico vigente
const MEDIO_PAGO_DIAN: Record<string, string> = {
  EFECTIVO: "10",
  NEQUI: "47",
  DATAFONO: "48",
};

type FacturaConRelaciones = Factura & {
  empresa: Empresa;
  tercero: Tercero | null;
  detalles: (DetalleFactura & {
    producto: {
      codigo: string;
      nombre: string;
      unidadMedida: { simbolo: string };
    };
  })[];
  pagos: PagoFactura[];
};

export function mapearFacturaAPayloadCanonico(
  factura: FacturaConRelaciones,
): PayloadCanonico {
  const esCredito = factura.pagos.some((p) => p.medioPago === "CREDITO");

  const medios: MedioPagoPayload[] = factura.pagos
    .filter((p) => p.medioPago !== "CREDITO")
    .map((p) => ({
      codigo: MEDIO_PAGO_DIAN[p.medioPago] ?? "1",
      monto: Number(p.monto),

      referencia: p.referencia ?? undefined,
    }));

  const items: ItemPayload[] = factura.detalles.map((d) => {
    const impuestos = [];
    if (Number(d.valorIva) > 0) {
      impuestos.push({
        tipo: "IVA" as const,
        porcentaje: Number(d.porcentajeIva),
        valor: Number(d.valorIva),
      });
    }
    if (Number(d.valorInc) > 0) {
      impuestos.push({
        tipo: "INC" as const,
        porcentaje: Number(d.porcentajeInc),
        valor: Number(d.valorInc),
      });
    }
    return {
      codigo: d.producto.codigo,
      descripcion: d.producto.nombre,
      cantidad: Number(d.cantidad),
      unidadMedida: d.producto.unidadMedida.simbolo,
      precioUnitario: Number(d.precioUnitario),
      descuento: Number(d.descuento),
      subtotal:
        Number(d.precioUnitario) * Number(d.cantidad) - Number(d.descuento),
      impuestos,
      total: Number(d.total),
    };
  });

  const adquirente: AdquirentePayload = factura.tercero
    ? {
        tipoDocumento: factura.tercero.tipoDocumento,
        numeroDocumento: factura.tercero.numeroDocumento,
        dv: factura.tercero.dv ?? undefined,
        tipoPersona: factura.tercero.tipoPersona,
        nombreCompleto: factura.tercero.nombreCompleto,
        direccion: factura.tercero.direccion ?? undefined,

        paisCodigo: "CO",
      }
    : {
        // Convención estándar DIAN para ventas sin identificar al comprador
        tipoDocumento: "CC",
        numeroDocumento: "222222222222",
        tipoPersona: "NATURAL",
        nombreCompleto: "Consumidor Final",
        paisCodigo: "CO",
      };

  return {
    emisor: {
      nit: factura.empresa.nit,
      dv: factura.empresa.dv,
      razonSocial: factura.empresa.razonSocial,
      nombreComercial: factura.empresa.nombreComercial ?? undefined,
      direccion: factura.empresa.direccion ?? undefined,
      paisCodigo: "CO",
      responsableIva: factura.empresa.responsableIva,
      responsableInc: factura.empresa.responsableInc,
    },
    adquirente,
    documento: {
      tipoDocumento: factura.tipoDocumento,
      prefijo: factura.prefijo,
      numero: factura.numero,
      fechaEmision: factura.fechaEmision.toISOString().slice(0, 10),
      horaEmision: factura.fechaEmision.toISOString().slice(11, 19),
      moneda: "COP",
    },
    items,

    totales: {
      subtotal: Number(factura.subtotal),
      totalDescuento: Number(factura.totalDescuento),
      totalIva: Number(factura.totalIva),
      totalInc: Number(factura.totalInc),
      total: Number(factura.total),
    },
    formaPago: { tipo: esCredito ? "CREDITO" : "CONTADO", medios },
  };
}
