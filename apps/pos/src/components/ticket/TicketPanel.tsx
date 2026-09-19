import TicketContent from "./TicketContent";

export default function TicketPanel() {
  return (
    <aside className="hidden md:flex w-full max-w-sm bg-toffee text-cream flex-col h-screen sticky top-0 p-6">
      <TicketContent />
    </aside>
  );
}
