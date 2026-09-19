import AppHeader from "../components/layout/AppHeader";
import NavTabs from "../components/layout/NavTabs";

export default function PlaceholderPage({ titulo }: { titulo: string }) {
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <NavTabs />
      <div className="p-8 text-ink/50 text-center">
        <p className="font-display text-2xl text-espresso mb-2">{titulo}</p>
        <p className="text-sm">Esta sección se construye más adelante.</p>
      </div>
    </div>
  );
}
