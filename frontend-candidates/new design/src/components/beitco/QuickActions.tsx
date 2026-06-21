import { Building2, DoorOpen, BedDouble, MapPinned, MessagesSquare } from "lucide-react";

const actions = [
  { label: "Find Apartment", icon: Building2, hint: "Verified rentals & sales" },
  { label: "Find Room", icon: DoorOpen, hint: "Share with trusted hosts" },
  { label: "Find Bed", icon: BedDouble, hint: "Students & coliving" },
  { label: "Explore Areas", icon: MapPinned, hint: "Know before you move" },
  { label: "Read Reviews", icon: MessagesSquare, hint: "From real residents" },
];

export function QuickActions() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-trust-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <a.icon className="h-5 w-5" />
            </span>
            <span>
              <div className="text-sm font-semibold text-foreground">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.hint}</div>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
