import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

const SAFETY = `You are CareCompanion, a calm health-information assistant for older adults and families.
STRICT RULES: general education only; never diagnose or prescribe; NEVER give doses, amounts, frequencies or schedules; never tell the person to start, stop or change a medicine; always point to their doctor or pharmacist. Use very simple words and short sentences. Reply in the requested language.
URGENT CARE: set "urgent" true if the question or text mentions anything that could need same-day or emergency care (e.g. chest pain, trouble breathing, fainting, signs of stroke, severe bleeding, allergic swelling, overdose, very abnormal results), and explain why in "urgentReason"; otherwise false and "".`;

const strArr = { type: "array", items: { type: "string" } };

const MED_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["refused", "refusalMessage", "urgent", "urgentReason", "summary", "medications", "clinicianQuestions"],
  properties: {
    refused: { type: "boolean" },
    refusalMessage: { type: "string" },
    urgent: { type: "boolean" },
    urgentReason: { type: "string" },
    summary: { type: "string" },
    medications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "whatItIsFor", "relevantInfo", "watchFor"],
        properties: { name: { type: "string" }, whatItIsFor: { type: "string" }, relevantInfo: { type: "string" }, watchFor: strArr },
      },
    },
    clinicianQuestions: strArr,
  },
};

const NOTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["urgent", "urgentReason", "simpleSummary", "keyTerms", "nextSteps", "clinicianQuestions"],
  properties: {
    urgent: { type: "boolean" },
    urgentReason: { type: "string" },
    simpleSummary: { type: "string" },
    keyTerms: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["term", "meaning"], properties: { term: { type: "string" }, meaning: { type: "string" } } },
    },
    nextSteps: strArr,
    clinicianQuestions: strArr,
  },
};

type Fail = { ok: false; error: "config" | "busy" | "credits" | "failed" };

async function callGateway(instructions: string, input: string, name: string, schema: object): Promise<{ ok: true; json: unknown } | Fail> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { ok: false, error: "config" };
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions,
      input,
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    console.error(`AI Gateway failed [${res.status}]: ${await res.text()}`);
    if (res.status === 429) return { ok: false, error: "busy" };
    if (res.status === 402 || res.status === 403) return { ok: false, error: "credits" };
    return { ok: false, error: "failed" };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev.type === "response.failed" || ev.type === "error") return { ok: false, error: "failed" };
      } catch {}
    }
  }
  try {
    return { ok: true, json: JSON.parse(text) };
  } catch {
    return { ok: false, error: "failed" };
  }
}

const lang = (l: "en" | "ar") => (l === "ar" ? "Arabic" : "English");

export type MedAnswer = {
  refused: boolean; refusalMessage: string; urgent: boolean; urgentReason: string; summary: string;
  medications: { name: string; whatItIsFor: string; relevantInfo: string; watchFor: string[] }[];
  clinicianQuestions: string[];
};

export const askMedicationQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      question: z.string().trim().min(3).max(500),
      medications: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
      language: z.enum(["en", "ar"]),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true; result: MedAnswer } | Fail> => {
    const r = await callGateway(
      SAFETY + `\nExplain only information about the listed medicines that is relevant to the question. If the question asks for a personal decision or a dose, set refused true with a kind refusalMessage (still fill urgent fields).`,
      `Language: ${lang(data.language)}\nMy medicines: ${data.medications.join(", ")}\nMy question: ${data.question}`,
      "medication_answer",
      MED_SCHEMA,
    );
    return r.ok ? { ok: true, result: r.json as MedAnswer } : r;
  });

export type NoteAnswer = {
  urgent: boolean; urgentReason: string; simpleSummary: string;
  keyTerms: { term: string; meaning: string }[]; nextSteps: string[]; clinicianQuestions: string[];
};

export const explainMedicalText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ text: z.string().trim().min(10).max(4000), language: z.enum(["en", "ar"]) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true; result: NoteAnswer } | Fail> => {
    const r = await callGateway(
      SAFETY + `\nThe user pasted a doctor's note, discharge letter, prescription label or lab report. Explain it in plain words, define medical terms, and give general next steps (like "ask your doctor about..."). Do not interpret beyond what is written.`,
      `Language: ${lang(data.language)}\nText:\n${data.text}`,
      "note_explainer",
      NOTE_SCHEMA,
    );
    return r.ok ? { ok: true, result: r.json as NoteAnswer } : r;
  });
