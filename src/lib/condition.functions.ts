import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are CareCompanion, a calm health-information assistant for elderly people and their families.
STRICT RULES:
- Give general educational information only. Never diagnose, never prescribe, never recommend a specific drug for this person.
- NEVER mention doses, amounts, frequencies or schedules of any medication.
- List medication CLASSES only (e.g. "ACE inhibitors"), with optional common example names, described as what doctors commonly prescribe.
- Always encourage consulting a doctor or pharmacist.
- If the user asks for a personal medical decision (should I take/stop/change X, how much), or the input is not a disease/syndrome/condition, set "refused" to true and explain kindly in "refusalMessage".
- Use very simple words, short sentences, suitable for older adults.
- Reply in the requested language.
Return ONLY JSON with this shape:
{"refused":boolean,"refusalMessage":string,"name":string,"explanation":string (max 5 short sentences),"symptoms":string[],"warningSigns":string[] (signs needing urgent care),"medicationClasses":[{"name":string,"purpose":string}],"lifestyle":string[],"doctorQuestions":string[],"interactions":[{"myMedication":string,"medicationClass":string,"warning":string}]}
"interactions": only list possible known conflicts between the user's current medications and the medication classes, in general terms; empty array if none or no medications given.`;

const Input = z.object({
  query: z.string().trim().min(2).max(120),
  language: z.enum(["en", "ar"]),
  medications: z.array(z.string().trim().max(80)).max(30),
});

export type ConditionResult = {
  refused: boolean;
  refusalMessage: string;
  name: string;
  explanation: string;
  symptoms: string[];
  warningSigns: string[];
  medicationClasses: { name: string; purpose: string }[];
  lifestyle: string[];
  doctorQuestions: string[];
  interactions: { myMedication: string; medicationClass: string; warning: string }[];
};

export const lookupCondition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; result: ConditionResult } | { ok: false; error: string }> => {
    const key = process.env["GROQ_API_KEY"];
    if (!key) return { ok: false, error: "config" };

    const user = `Language: ${data.language === "ar" ? "Arabic" : "English"}
Condition: ${data.query}
My current medications: ${data.medications.length ? data.medications.join(", ") : "none"}`;

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`Groq request failed [${res.status}]: ${await res.text()}`);
      return { ok: false, error: res.status === 429 ? "busy" : "failed" };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const r = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
      const arr = (v: unknown) => (Array.isArray(v) ? v : []);
      return {
        ok: true,
        result: {
          refused: !!r.refused,
          refusalMessage: String(r.refusalMessage ?? ""),
          name: String(r.name ?? data.query),
          explanation: String(r.explanation ?? ""),
          symptoms: arr(r.symptoms).map(String),
          warningSigns: arr(r.warningSigns).map(String),
          medicationClasses: arr(r.medicationClasses),
          lifestyle: arr(r.lifestyle).map(String),
          doctorQuestions: arr(r.doctorQuestions).map(String),
          interactions: arr(r.interactions),
        },
      };
    } catch {
      return { ok: false, error: "failed" };
    }
  });
