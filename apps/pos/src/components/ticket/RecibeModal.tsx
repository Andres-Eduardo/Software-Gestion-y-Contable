interface ReciboInfo {
  id: string;
  prefijo: string;
  numero: number;
  total: string;
}

interface Props {
  factura: ReciboInfo;
  onClose: () => void;
}

export default function ReciboModal({ factura, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Cerrar recibo" onClick={onClose} className="absolute inset-0 bg-espresso/50" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <h2 className="font-display text-2xl text-espresso mb-1">
          {factura.prefijo}-{factura.numero}
        </h2>
        <p className="text-caramel font-semibold text-lg mb-4 tabular-nums">
          ${Number(factura.total).toLocaleString("es-CO")}
        </p>

        <div className="w-11 h-11 rounded-full bg-olive/10 flex items-center justify-center mx-auto mb-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B8047" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-olive font-semibold text-sm mb-5">Venta registrada</p>

        <button
          onClick={onClose}
          className="w-full bg-paper text-espresso font-semibold rounded-lg py-2.5 text-sm hover:brightness-95 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}