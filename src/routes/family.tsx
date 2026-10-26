import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Siren, Trash2, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family — CareCompanion" },
      { name: "description", content: "Save family phone numbers and call them with one press in an emergency." },
      { property: "og:title", content: "Family — CareCompanion" },
      { property: "og:description", content: "One-press emergency calls to your family." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  const { t, contacts, setContacts } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(false);

  function addContact() {
    const n = name.trim();
    const p = phone.trim();
    if (!n || !/^[+0-9][0-9\s()-]{4,}$/.test(p)) {
      setError(true);
      return;
    }
    setError(false);
    setContacts([...contacts, { name: n, phone: p }]);
    setName("");
    setPhone("");
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">{t.familyTitle}</h1>
      <p className="mt-3 text-muted-foreground">{t.familyIntro}</p>

      {contacts.length > 0 && (
        <section className="mt-6 space-y-4" aria-label={t.alertTitle}>
          <h2 className="flex items-center gap-3 text-2xl font-bold">
            <Siren className="h-8 w-8 text-destructive" />
            {t.alertTitle}
          </h2>
          <p className="text-muted-foreground">{t.alertBody}</p>
          {contacts.map((c, i) => (
            <div key={i} className="emergency">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-2xl font-bold">{c.name}</p>
                  <p className="text-xl" dir="ltr">{c.phone}</p>
                </div>
                <button
                  onClick={() => setContacts(contacts.filter((_, k) => k !== i))}
                  className="icon-btn shrink-0"
                  aria-label={`${t.remove}: ${c.name}`}
                >
                  <Trash2 className="h-7 w-7" />
                </button>
              </div>
              <a href={`tel:${c.phone.replace(/[\s()-]/g, "")}`} className="btn-emergency mt-4">
                <Phone className="h-7 w-7" /> {t.callNow}
              </a>
            </div>
          ))}
        </section>
      )}

      <section className="card-soft mt-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold">
          <UserPlus className="h-8 w-8 text-primary" />
          {t.add}
        </h2>
        {contacts.length === 0 && <p className="mt-3 text-muted-foreground">{t.contactsEmpty}</p>}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addContact();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.contactName}
            className="field"
            maxLength={60}
            aria-label={t.contactName}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.contactPhone}
            className="field"
            maxLength={20}
            inputMode="tel"
            dir="ltr"
            aria-label={t.contactPhone}
          />
          {error && (
            <p className="font-semibold text-destructive" role="alert">
              {t.invalidPhone}
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            <UserPlus className="h-7 w-7" /> {t.add}
          </button>
        </form>
      </section>

      <div className="card-soft mt-6 flex items-start gap-4">
        <Users className="h-10 w-10 shrink-0 text-primary" />
        <div>
          <span className="inline-block rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
            {t.comingSoon}
          </span>
          <p className="mt-3">{t.familyBody}</p>
        </div>
      </div>
    </AppShell>
  );
}
