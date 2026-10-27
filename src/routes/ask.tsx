import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Loader2, Sparkles, Siren, Phone, Pill, ClipboardList, FileText, Plus, X, BookOpen, Footprints } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/app-state";
import { isEmergency } from "@/lib/emergency";
import { askMedicationQuestion, explainMedicalText, type MedAnswer, type NoteAnswer } from "@/lib/ai.functions";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask AI about my medicines — CareCompanion" },
      { name: "description", content: "Ask a question about your medicines or paste a doctor's note and get a plain-language explanation." },
      { property: "og:title", content: "Ask AI about my medicines — CareCompanion" },
      { property: "og:description", content: "Plain-language medicine answers, questions for your doctor and urgent-care alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AskPage,
});

function AskPage() {
  const { t } = useApp();
  const [tab, setTab] = useState<"med" | "note">("med");
  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">{t.askTitle}</h1>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => setTab("med")} className={tab === "med" ? "btn-primary px-2" : "btn-soft px-2"}>
          <Pill className="h-6 w-6" /> {t.tabMed}
        </button>
        <button onClick={() => setTab("note")} className={tab === "note" ? "btn-primary px-2" : "btn-soft px-2"}>
          <FileText className="h-6 w-6" /> {t.tabNote}
        </button>
      </div>
      {tab === "med" ? <MedQuestion /> : <NoteExplainer />}
    </AppShell>
  );
}

function useErr() {
  const { t } = useApp();
  return (e: string) => (e === "busy" ? t.errBusy : e === "config" ? t.errConfig : e === "credits" ? t.errCredits : t.errFailed);
}

function MedQuestion() {
  const { t, lang, meds: savedMeds } = useApp();
  const ask = useServerFn(askMedicationQuestion);
  const errText = useErr();
  const [meds, setMeds] = useState<string[]>(savedMeds);
  const [med, setMed] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [res, setRes] = useState<MedAnswer | null>(null);

  const addMed = () => {
    const n = med.trim();
    if (n && !meds.some((m) => m.toLowerCase() === n.toLowerCase())) setMeds([...meds, n].slice(0, 30));
    setMed("");
  };

  async function submit() {
    setError(null); setRes(null);
    if (isEmergency(q)) { setEmergency(true); return; }
    setEmergency(false);
    if (!meds.length) { setError(t.needMed); return; }
    if (q.trim().length < 3) return;
    setLoading(true);
    try {
      const r = await ask({ data: { question: q, medications: meds, language: lang } });
      if (r.ok) setRes(r.result); else setError(errText(r.error));
    } catch { setError(t.errFailed); } finally { setLoading(false); }
  }

  return (
    <div className="mt-5 space-y-4">
      <p className="text-muted-foreground">{t.medQIntro}</p>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <input value={med} onChange={(e) => setMed(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMed())} placeholder={t.medsPlaceholder} className="field" maxLength={80} />
        <button type="button" onClick={addMed} className="btn-soft px-4"><Plus className="h-6 w-6" /> {t.add}</button>
      </div>
      {meds.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {meds.map((m) => (
            <li key={m} className="card-soft flex items-center gap-2 !p-2 font-semibold">
              {m}
              <button onClick={() => setMeds(meds.filter((x) => x !== m))} aria-label={`${t.remove} ${m}`}><X className="h-5 w-5" /></button>
            </li>
          ))}
        </ul>
      )}
      <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.medQPlaceholder} className="field min-h-28" maxLength={500} />
      <button onClick={submit} className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Sparkles className="h-7 w-7" />} {t.askBtn}
      </button>
      <Status loading={loading} error={error} emergency={emergency} />
      {res && res.refused && <div className="card-soft"><p>{res.refusalMessage}</p></div>}
      {res && <Urgent show={res.urgent} reason={res.urgentReason} />}
      {res && !res.refused && (
        <>
          <Card icon={<BookOpen />} title={t.answer}><p>{res.summary}</p></Card>
          {res.medications.map((m, k) => (
            <Card key={k} icon={<Pill />} title={m.name}>
              <p><strong>{t.usedFor}:</strong> {m.whatItIsFor}</p>
              <p className="mt-2">{m.relevantInfo}</p>
              {m.watchFor.length > 0 && (<><p className="mt-2 font-bold">{t.watchFor}</p><Bullets items={m.watchFor} /></>)}
            </Card>
          ))}
          <Card icon={<ClipboardList />} title={t.questions}><Bullets items={res.clinicianQuestions} /></Card>
        </>
      )}
    </div>
  );
}

function NoteExplainer() {
  const { t, lang } = useApp();
  const explain = useServerFn(explainMedicalText);
  const errText = useErr();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<NoteAnswer | null>(null);

  async function submit() {
    if (text.trim().length < 10) return;
    setError(null); setRes(null); setLoading(true);
    try {
      const r = await explain({ data: { text, language: lang } });
      if (r.ok) setRes(r.result); else setError(errText(r.error));
    } catch { setError(t.errFailed); } finally { setLoading(false); }
  }

  return (
    <div className="mt-5 space-y-4">
      <p className="text-muted-foreground">{t.noteIntro}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.notePlaceholder} className="field min-h-40" maxLength={4000} />
      <button onClick={submit} className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Sparkles className="h-7 w-7" />} {t.explainBtn}
      </button>
      <Status loading={loading} error={error} emergency={false} />
      {res && (
        <>
          <Urgent show={res.urgent} reason={res.urgentReason} />
          <Card icon={<BookOpen />} title={t.inSimpleWords}><p>{res.simpleSummary}</p></Card>
          {res.keyTerms.length > 0 && (
            <Card icon={<FileText />} title={t.keyTerms}>
              <ul className="space-y-2">{res.keyTerms.map((k, i) => <li key={i}><strong>{k.term}</strong> — {k.meaning}</li>)}</ul>
            </Card>
          )}
          <Card icon={<Footprints />} title={t.nextSteps}><Bullets items={res.nextSteps} /></Card>
          <Card icon={<ClipboardList />} title={t.questions}><Bullets items={res.clinicianQuestions} /></Card>
        </>
      )}
    </div>
  );
}

function Status({ loading, error, emergency }: { loading: boolean; error: string | null; emergency: boolean }) {
  const { t } = useApp();
  return (
    <>
      {loading && <div className="card-soft flex items-center gap-4" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p>{t.loading}</p></div>}
      {error && <div className="card-soft border-2 border-destructive/40" role="alert"><p>{error}</p></div>}
      {emergency && <Urgent show reason={t.emergencyBody} />}
    </>
  );
}

function Urgent({ show, reason }: { show: boolean; reason: string }) {
  const { t } = useApp();
  if (!show) return null;
  return (
    <div className="emergency" role="alert">
      <div className="flex items-center gap-3"><Siren className="h-10 w-10 shrink-0" /><h2 className="font-display text-2xl font-bold">{t.urgentTitle}</h2></div>
      <p className="mt-3">{reason}</p>
      <a href="tel:998" className="btn-emergency mt-4"><Phone className="h-7 w-7" /> {t.callAmbulance}</a>
    </div>
  );
}

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="card-soft">
      <h3 className="mb-3 flex items-center gap-3 text-2xl font-bold [&>svg]:h-8 [&>svg]:w-8">{icon}{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 ps-6">{items.map((s, k) => <li key={k}>{s}</li>)}</ul>;
}
