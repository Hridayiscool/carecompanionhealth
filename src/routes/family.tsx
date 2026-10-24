import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/app-state";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family — CareCompanion" },
      { name: "description", content: "Link family members for medicine reminders and shared health notes." },
      { property: "og:title", content: "Family — CareCompanion" },
      { property: "og:description", content: "Family mode for caring together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FamilyPage,
});

function FamilyPage() {
  const { t } = useApp();
  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">{t.familyTitle}</h1>
      <div className="card-soft mt-5 flex items-start gap-4">
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
