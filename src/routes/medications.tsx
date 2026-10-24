import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pill } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/medications")({
  head: () => ({
    meta: [
      { title: "My Medications — CareCompanion" },
      { name: "description", content: "Keep a simple list of the medicines you take and get interaction warnings." },
      { property: "og:title", content: "My Medications — CareCompanion" },
      { property: "og:description", content: "Your medicine list, with gentle interaction warnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MedsPage,
});

function MedsPage() {
  const { t, meds, setMeds } = useApp();
  const [name, setName] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n || meds.some((m) => m.toLowerCase() === n.toLowerCase())) return;
    setMeds([...meds, n].slice(0, 30));
    setName("");
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">{t.medsTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.medsIntro}</p>
      <form
        className="mt-5 grid grid-cols-[1fr_auto] gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.medsPlaceholder} className="field" maxLength={80} />
        <button className="btn-primary px-5" type="submit">
          <Plus className="h-7 w-7" /> {t.add}
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {meds.length === 0 && <li className="card-soft text-muted-foreground">{t.medsEmpty}</li>}
        {meds.map((m) => (
          <li key={m} className="card-soft flex items-center justify-between gap-3">
            <span className="flex items-center gap-3 font-semibold">
              <Pill className="h-7 w-7 text-secondary-foreground" /> {m}
            </span>
            <button onClick={() => setMeds(meds.filter((x) => x !== m))} className="icon-btn" aria-label={`${t.remove} ${m}`}>
              <Trash2 className="h-7 w-7" />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
