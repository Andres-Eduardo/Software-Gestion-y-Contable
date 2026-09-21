import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useAuthStore } from "../../store/auth.store";
import { apiFetch } from "../../api/client";

interface FacturaEstado {
  id: string;
  prefijo: string;
  numero: number;
  total: string;
  estadoDian: string;
  cufe: string | null;
  observaciones: string | null;
}

interface Props {
  facturaId: string;
  onClose: () => void;
}

const MAX_INTENTOS = 15;

export default function ReciboModal({ facturaId, onClose }: Props) {
  const token = useAuthStore((s) => s.token)!;
  const [factura, setFactura] = useState<FacturaEstado | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const intentosRef = useRef(0);

  useEffect(() => {
    let activo = true;

    async function consultar() {
      try {
        const data = await apiFetch<FacturaEstado>(`/facturas/${facturaId}`, {
          token,
        });
        if (!activo) return;
        setFactura(data);

        const terminado =
          data.estadoDian === "ACEPTADO" || data.estadoDian === "RECHAZADO";
        intentosRef.current += 1;

        if (!terminado && intentosRef.current < MAX_INTENTOS) {
          setTimeout(consultar, 1500);
        }
      } catch {
        if (activo && intentosRef.current < MAX_INTENTOS) {
          intentosRef.current += 1;
          setTimeout(consultar, 1500);
        }
      }
    }

    consultar();
    return () => {
      activo = false;
    };
  }, [facturaId, token]);

  useEffect(() => {
    if (!factura?.cufe) return;
    const texto = `CUFE:${factura.cufe}|TOTAL:${factura.total}|SIMULADO`;
    QRCode.toDataURL(texto, { width: 180, margin: 1 }).then(setQrDataUrl);
  }, [factura?.cufe]);

  const estado = factura?.estadoDian ?? "PENDIENTE";

  const enProceso = estado === "PENDIENTE" || estado === "EN_PROCESO";
  const aceptado = estado === "ACEPTADO";
  const rechazado = estado === "RECHAZADO";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar recibo"
        onClick={onClose}
        className="absolute inset-0 bg-espresso/50"
      />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <h2 className="font-display text-2xl text-espresso mb-1">
          {factura ? `${factura.prefijo}-${factura.numero}` : "Procesando..."}
        </h2>
        {factura && (
          <p className="text-caramel font-semibold text-lg mb-4 tabular-nums">
            ${Number(factura.total).toLocaleString("es-CO")}
          </p>
        )}

        {enProceso && (
          <div className="py-4">
            <div className="w-8 h-8 border-3 border-caramel/30 border-t-caramel rounded-full animate-spin mx-auto mb-3" />
            <p className="text-ink/60 text-sm">Enviando a la DIAN...</p>
          </div>
        )}

        {aceptado && (
          <div className="py-2">
            <p className="text-olive font-semibold text-sm mb-3">
              ✓ Aceptada por la DIAN
            </p>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Código QR de verificación"
                className="mx-auto mb-3 rounded-lg"
              />
            )}
            <p className="text-[10px] text-ink/40 mb-3">
              QR de prueba (simulado)
            </p>
            <p className="text-ink/50 text-xs break-all font-mono">
              {factura?.cufe}
            </p>
          </div>
        )}

        {rechazado && (
          <div className="py-4">
            <p className="text-brick font-semibold text-sm mb-2">
              Rechazada por la DIAN
            </p>
            {factura?.observaciones && (
              <p className="text-ink/50 text-xs">{factura.observaciones}</p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full bg-caramel text-espresso font-semibold rounded-lg py-2.5 text-sm hover:brightness-95 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
