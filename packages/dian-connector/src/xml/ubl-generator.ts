import { create } from "xmlbuilder2";
import type {
  PayloadCanonico,
  ItemPayload,
} from "../types/payload-canonico.js";

// Estructura simplificada conforme al esquema UBL 2.1 / Anexo Técnico 1.9 DIAN.
// PENDIENTE: validar campos obligatorios adicionales (extensiones DIAN, sección de firma,
// generación del código QR, resolución de numeración autorizada) contra el XSD oficial y
// los ejemplos de la Guía Técnica cuando se inicie el ambiente de habilitación real con el
// contador. Los códigos de esquema de impuesto (IVA "01", INC "04") también están pendientes
// de esa misma validación final.

const TAX_SCHEME: Record<string, { id: string; name: string }> = {
  IVA: { id: "01", name: "IVA" },
  INC: { id: "04", name: "Impuesto Nacional al Consumo" },
};

const ROOT_TAG = {
  FACTURA_VENTA: "Invoice",
  NOTA_CREDITO: "CreditNote",
  NOTA_DEBITO: "DebitNote",
} as const;

const NAMESPACE_ROOT = {
  FACTURA_VENTA: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  NOTA_CREDITO: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
  NOTA_DEBITO: "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2",
} as const;

const TYPE_CODE_TAG = {
  FACTURA_VENTA: "cbc:InvoiceTypeCode",
  NOTA_CREDITO: "cbc:CreditNoteTypeCode",
  NOTA_DEBITO: "cbc:DebitNoteTypeCode",
} as const;

const LINE_TAG = {
  FACTURA_VENTA: "cac:InvoiceLine",
  NOTA_CREDITO: "cac:CreditNoteLine",
  NOTA_DEBITO: "cac:DebitNoteLine",
} as const;

const QUANTITY_TAG = {
  FACTURA_VENTA: "cbc:InvoicedQuantity",
  NOTA_CREDITO: "cbc:CreditedQuantity",
  NOTA_DEBITO: "cbc:DebitedQuantity",
} as const;

function montoConMoneda(valor: number, moneda: string) {
  return { "@currencyID": moneda, "#text": valor.toFixed(2) };
}

function construirTaxTotal(payload: PayloadCanonico, tipo: "IVA" | "INC") {
  const valorTotal =
    tipo === "IVA" ? payload.totales.totalIva : payload.totales.totalInc;
  if (valorTotal <= 0) return null;

  const scheme = TAX_SCHEME[tipo];
  const itemsConEsteImpuesto = payload.items.filter((it) =>
    it.impuestos.some((imp) => imp.tipo === tipo),
  );
  const baseGravable = itemsConEsteImpuesto.reduce(
    (acc, it) => acc + it.subtotal,
    0,
  );
  const porcentaje =
    itemsConEsteImpuesto[0]?.impuestos.find((imp) => imp.tipo === tipo)
      ?.porcentaje ?? 0;

  return {
    "cbc:TaxAmount": montoConMoneda(valorTotal, payload.documento.moneda),
    "cac:TaxSubtotal": {
      "cbc:TaxableAmount": montoConMoneda(
        baseGravable,
        payload.documento.moneda,
      ),
      "cbc:TaxAmount": montoConMoneda(valorTotal, payload.documento.moneda),
      "cbc:Percent": porcentaje.toFixed(2),
      "cac:TaxCategory": {
        "cac:TaxScheme": { "cbc:ID": scheme.id, "cbc:Name": scheme.name },
      },
    },
  };
}

function construirLinea(
  item: ItemPayload,
  index: number,
  payload: PayloadCanonico,
) {
  const quantityTag = QUANTITY_TAG[payload.documento.tipoDocumento];
  return {
    "cbc:ID": String(index + 1),
    [quantityTag]: { "@unitCode": item.unidadMedida, "#text": item.cantidad },
    "cbc:LineExtensionAmount": montoConMoneda(
      item.subtotal,
      payload.documento.moneda,
    ),
    "cac:TaxTotal": item.impuestos.map((imp) => ({
      "cbc:TaxAmount": montoConMoneda(imp.valor, payload.documento.moneda),
      "cac:TaxSubtotal": {
        "cbc:TaxableAmount": montoConMoneda(
          item.subtotal,
          payload.documento.moneda,
        ),
        "cbc:TaxAmount": montoConMoneda(imp.valor, payload.documento.moneda),
        "cbc:Percent": imp.porcentaje.toFixed(2),
        "cac:TaxCategory": {
          "cac:TaxScheme": {
            "cbc:ID": TAX_SCHEME[imp.tipo].id,
            "cbc:Name": TAX_SCHEME[imp.tipo].name,
          },
        },
      },
    })),
    "cac:Item": {
      "cbc:Description": item.descripcion,
      "cac:StandardItemIdentification": { "cbc:ID": item.codigo },
    },
    "cac:Price": {
      "cbc:PriceAmount": montoConMoneda(
        item.precioUnitario,
        payload.documento.moneda,
      ),
    },
  };
}

export function generarXmlUBL(payload: PayloadCanonico): string {
  const tipo = payload.documento.tipoDocumento;
  const taxTotals = [
    construirTaxTotal(payload, "IVA"),
    construirTaxTotal(payload, "INC"),
  ].filter((t) => t !== null);

  const bodyObj = {
    [ROOT_TAG[tipo]]: {
      "@xmlns": NAMESPACE_ROOT[tipo],
      "@xmlns:cac":
        "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "@xmlns:cbc":
        "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      "@xmlns:ext":
        "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",

      "cbc:UBLVersionID": "UBL 2.1",
      "cbc:CustomizationID": "10",
      "cbc:ID": `${payload.documento.prefijo}${payload.documento.numero}`,
      "cbc:IssueDate": payload.documento.fechaEmision,
      "cbc:IssueTime": payload.documento.horaEmision,
      [TYPE_CODE_TAG[tipo]]: "01",
      "cbc:DocumentCurrencyCode": payload.documento.moneda,

      "cac:AccountingSupplierParty": {
        "cac:Party": {
          "cac:PartyName": {
            "cbc:Name":
              payload.emisor.nombreComercial ?? payload.emisor.razonSocial,
          },
          "cac:PartyTaxScheme": {
            "cbc:RegistrationName": payload.emisor.razonSocial,
            "cbc:CompanyID": {
              "@schemeID": String(payload.emisor.dv),
              "#text": payload.emisor.nit,
            },
            "cac:TaxScheme": { "cbc:ID": "01", "cbc:Name": "IVA" },
          },
          "cac:PartyLegalEntity": {
            "cbc:RegistrationName": payload.emisor.razonSocial,
          },
        },
      },

      "cac:AccountingCustomerParty": {
        "cac:Party": {
          "cac:PartyTaxScheme": {
            "cbc:RegistrationName": payload.adquirente.nombreCompleto,
            "cbc:CompanyID": {
              "@schemeID": payload.adquirente.dv
                ? String(payload.adquirente.dv)
                : "0",
              "#text": payload.adquirente.numeroDocumento,
            },
            "cac:TaxScheme": { "cbc:ID": "ZZ", "cbc:Name": "No aplica" },
          },
          "cac:PartyLegalEntity": {
            "cbc:RegistrationName": payload.adquirente.nombreCompleto,
          },
        },
      },

      "cac:PaymentMeans": {
        "cbc:PaymentMeansCode":
          payload.formaPago.tipo === "CREDITO" ? "1" : "10",
        "cbc:PaymentDueDate": payload.documento.fechaEmision,
      },

      ...(taxTotals.length > 0 ? { "cac:TaxTotal": taxTotals } : {}),

      "cac:LegalMonetaryTotal": {
        "cbc:LineExtensionAmount": montoConMoneda(
          payload.totales.subtotal,
          payload.documento.moneda,
        ),
        "cbc:TaxExclusiveAmount": montoConMoneda(
          payload.totales.subtotal - payload.totales.totalDescuento,
          payload.documento.moneda,
        ),
        "cbc:TaxInclusiveAmount": montoConMoneda(
          payload.totales.total,
          payload.documento.moneda,
        ),
        "cbc:AllowanceTotalAmount": montoConMoneda(
          payload.totales.totalDescuento,
          payload.documento.moneda,
        ),
        "cbc:PayableAmount": montoConMoneda(
          payload.totales.total,
          payload.documento.moneda,
        ),
      },

      [LINE_TAG[tipo]]: payload.items.map((item, index) =>
        construirLinea(item, index, payload),
      ),
    },
  };

  return create({ version: "1.0", encoding: "UTF-8" })
    .ele(bodyObj)
    .end({ prettyPrint: true });
}
