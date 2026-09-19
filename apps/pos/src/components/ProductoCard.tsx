interface Props {
  nombre: string;
  precioVenta: number;
  onClick: () => void;
}

export default function ProductoCard({ nombre, precioVenta, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-ink/10 rounded-xl p-4 text-left hover:border-caramel hover:bg-caramel/5 transition active:scale-[0.98]"
    >
      <p className="font-medium text-ink">{nombre}</p>
      <p className="text-caramel font-semibold tabular-nums mt-1">
        ${precioVenta.toLocaleString("es-CO")}
      </p>
    </button>
  );
}
