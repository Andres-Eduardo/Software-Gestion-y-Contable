import { createHash } from "node:crypto";
import type { IFirmadorXml, ResultadoFirma } from "./firmador.interface.js";

// Firmador SIMULADO — no produce una firma XAdES-EPES criptográficamente válida ni
// verificable por la DIAN. Se usa mientras no exista el certificado .p12/.pfx real
// del trámite en curso con el contador. Inserta un bloque <ds:Signature> con la forma
// y ubicación correctas (mismo lugar donde iría la firma real) para que el resto del
// pipeline (empaquetado, envío, cola de tareas) se pueda construir y probar completo
// sin esperar el certificado. Cuando llegue, se reemplaza por FirmadorReal, que
// implementa la misma interfaz — nada más en el sistema necesita cambiar.
export class FirmadorMock implements IFirmadorXml {
  async firmar(xmlSinFirmar: string): Promise<ResultadoFirma> {
    const huellaSimulada = createHash("sha256")
      .update(xmlSinFirmar)
      .digest("base64");

    const bloqueFirma = [
      '  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="SignatureMock">',
      "    <ds:SignedInfo>",
      '      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>',
      '      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>',
      "    </ds:SignedInfo>",
      `    <ds:SignatureValue>${huellaSimulada}</ds:SignatureValue>`,
      "    <ds:Object>",
      '      <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#">',
      "        <!-- FIRMA SIMULADA: reemplazar por XAdES-EPES real con el certificado oficial -->",
      "      </xades:QualifyingProperties>",
      "    </ds:Object>",
      "  </ds:Signature>",
    ].join("\n");

    const xmlLimpio = xmlSinFirmar.trimEnd();
    const posicionUltimoCierre = xmlLimpio.lastIndexOf("</");

    const xmlFirmado =
      xmlLimpio.slice(0, posicionUltimoCierre) +
      bloqueFirma +
      "\n" +
      xmlLimpio.slice(posicionUltimoCierre);

    return { xmlFirmado, esFirmaSimulada: true };
  }
}
