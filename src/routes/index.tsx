import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type ReactNode } from "react";
import {
  Mic, Search, Loader2, Volume2, Square, Printer, Phone, AlertTriangle,
  BookOpen, Activity, Siren, Pill, Salad, ClipboardList,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/app-state";
import { isEmergency } from "@/lib/emergency";
import { lookupCondition, type ConditionResult } from "@/lib/condition.functions";
import { speak, stopSpeaking, getRecognition } from "@/lib/speech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareCompanion — Health info made simple" },
      { name: "description", content: "Plain-language explanations of health conditions for older adults and their families." },
      { property: "og:title", content: "CareCompanion — Health info made simple" },
      { property: "og:description", content: "Understand a condition, its warning signs and questions to ask your doctor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t, lang, meds } = useApp();
  const lookup = useServerFn(lookupCondition);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [result, setResult] = useState<ConditionResult | null>(null);
  const [listening, setListening] = useState(false);
  const [reading, setReading] = useState(false);
  const recRef = useRef<ReturnType<typeof getRecognition>>(null);

  async function run(q: string) {
    const text = q.trim();
    if (text.length < 2) return;
    stopSpeaking();
    setReading(false);
    setError(null);
    setResult(null);
    if (isEmergency(text)) {
      setEmergency(true);
      return;
    }
    setEmergency(false);
    setLoading(true);
    try {
      const r = await lookup({ data: { query: text, language: lang, medications: meds } });
      if (r.ok) setResult(r.result);
      else setError(r.error === "busy" ? t.errBusy : r.error === "config" ? t.errConfig : t.errFailed);
    } catch {
      setError(t.errFailed);
    } finally {
      setLoading(false);
    }
  }

  function startVoice() {
    const r = getRecognition(lang);
    if (!r) return;
    recRef.current = r;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const said = e.results[0][0].transcript as string;
      setQuery(said);
      run(said);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true);
    r.start();
  }

  function readAll() {
    if (!result) return;
    if (reading) {
      stopSpeaking();
      setReading(false);
      return;
    }
    const parts = [
      result.name, result.explanation,
      t.symptoms, ...result.symptoms,
      t.warningSigns, ...result.warningSigns,
      t.medClasses, ...result.medicationClasses.map((m) => `${m.name}. ${m.purpose}`), t.medNote,
      t.lifestyle, ...result.lifestyle,
      t.questions, ...result.doctorQuestions,
      t.disclaimer,
    ];
    setReading(true);
    speak(parts.join(". "), lang, () => setReading(false));
  }

  return (
    <AppShell>
      <section className="print:hidden">
        <h1 className="font-display text-3xl font-bold leading-tight">{t.searchTitle}</h1>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(query);
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="field"
            maxLength={120}
            aria-label={t.searchTitle}
          />
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Search className="h-7 w-7" />}
              {t.searchBtn}
            </button>
            <button type="button" onClick={startVoice} className="btn-soft px-5" aria-label={t.speak}>
              <Mic className={`h-7 w-7 ${listening ? "animate-pulse text-destructive" : ""}`} />
              {listening ? t.listening : t.speak}
            </button>
          </div>
        </form>
      </section>

      {loading && (
        <div className="card-soft mt-6 flex items-center gap-4" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>{t.loading}</p>
        </div>
      )}

      {error && (
        <div className="card-soft mt-6 border-2 border-destructive/40" role="alert">
          <p>{error}</p>
        </div>
      )}

      {emergency && (
        <div className="emergency mt-6" role="alert">
          <div className="flex items-center gap-3">
            <Siren className="h-10 w-10 shrink-0" />
            <h2 className="font-display text-3xl font-bold">{t.emergencyTitle}</h2>
          </div>
          <p className="mt-3">{t.emergencyBody}</p>
          <a href="tel:112" className="btn-emergency mt-4">
            <Phone className="h-7 w-7" /> {t.callBtn}
          </a>
        </div>
      )}

      {result && result.refused && (
        <div className="card-soft mt-6">
          <p>{result.refusalMessage}</p>
        </div>
      )}

      {result && !result.refused && (
        <article className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-bold text-primary">{result.name}</h2>
            <div className="grid w-full grid-cols-2 gap-2 print:hidden">
              <button onClick={readAll} className="btn-soft">
                {reading ? <Square className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                {reading ? t.stop : t.readAloud}
              </button>
              <button onClick={() => window.print()} className="btn-soft">
                <Printer className="h-6 w-6" /> {t.share}
              </button>
            </div>
          </div>

          <p className="hidden print:block">{t.summaryFor} — {new Date().toLocaleDateString()}</p>

          {result.interactions.length > 0 && (
            <div className="warning-card">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 shrink-0" />
                <h3 className="text-2xl font-bold">{t.interactions}</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {result.interactions.map((i, k) => (
                  <li key={k}>
                    <strong>{i.myMedication}</strong> + {i.medicationClass}: {i.warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section icon={<BookOpen />} title={t.explanation} lang={lang} speakText={result.explanation}>
            <p>{result.explanation}</p>
          </Section>
          <Section icon={<Activity />} title={t.symptoms} lang={lang} speakText={result.symptoms.join(". ")}>
            <List items={result.symptoms} />
          </Section>
          <Section icon={<Siren />} title={t.warningSigns} tone="urgent" lang={lang} speakText={result.warningSigns.join(". ")}>
            <List items={result.warningSigns} />
          </Section>
          <Section
            icon={<Pill />}
            title={t.medClasses}
            lang={lang}
            speakText={result.medicationClasses.map((m) => `${m.name}. ${m.purpose}`).join(". ") + ". " + t.medNote}
          >
            <ul className="space-y-3">
              {result.medicationClasses.map((m, k) => (
                <li key={k}>
                  <strong>{m.name}</strong> — {m.purpose}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-muted-foreground">{t.medNote}</p>
          </Section>
          <Section icon={<Salad />} title={t.lifestyle} lang={lang} speakText={result.lifestyle.join(". ")}>
            <List items={result.lifestyle} />
          </Section>
          <Section icon={<ClipboardList />} title={t.questions} lang={lang} speakText={result.doctorQuestions.join(". ")}>
            <ul className="space-y-3">
              {result.doctorQuestions.map((q, k) => (
                <li key={k}>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1.5 h-7 w-7 shrink-0 accent-primary" />
                    <span>{q}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Section>

          {meds.length > 0 && (
            <div className="hidden print:block">
              <h3 className="text-2xl font-bold">{t.myMeds}</h3>
              <p>{meds.join(", ")}</p>
            </div>
          )}
          <p className="disclaimer-print hidden print:block">{t.disclaimer}</p>
        </article>
      )}
    </AppShell>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 ps-6">
      {items.map((s, k) => (
        <li key={k}>{s}</li>
      ))}
    </ul>
  );
}

function Section({
  icon, title, children, tone, speakText, lang,
}: {
  icon: ReactNode; title: string; children: ReactNode; tone?: "urgent"; speakText: string; lang: "en" | "ar";
}) {
  const { t } = useApp();
  return (
    <section className={tone === "urgent" ? "card-urgent" : "card-soft"}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-3 text-2xl font-bold [&>svg]:h-8 [&>svg]:w-8">
          {icon}
          {title}
        </h3>
        <button
          onClick={() => speak(`${title}. ${speakText}`, lang)}
          className="icon-btn print:hidden"
          aria-label={`${t.readAloud}: ${title}`}
        >
          <Volume2 className="h-7 w-7" />
        </button>
      </div>
      {children}
    </section>
  );
}
