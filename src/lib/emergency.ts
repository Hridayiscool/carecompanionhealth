// Phrases that mean "stop searching, call emergency services now".
const PATTERNS: RegExp[] = [
  /chest\s*pain/i,
  /chest\s*(tight|pressure)/i,
  /heart\s*attack/i,
  /\bstroke\b/i,
  /face\s*(droop|drooping)/i,
  /slurred\s*speech/i,
  /(can'?t|cannot|trouble|difficulty)\s*(breath|breathing|speak)/i,
  /short(ness)?\s*of\s*breath/i,
  /(arm|side)\s*(weak|numb)/i,
  /unconscious|passed\s*out|fainted|seizure/i,
  /severe\s*bleeding|coughing\s*blood|vomiting\s*blood/i,
  /suicid|kill\s*myself/i,
  /ألم\s*(في\s*)?(الصدر|صدري)/,
  /جلطة|سكتة/,
  /ضيق\s*(في\s*)?(التنفس|النفس)/,
  /صعوبة\s*(في\s*)?(التنفس|الكلام)/,
  /إغماء|فقدان\s*الوعي|نزيف\s*شديد|تشنج/,
];

export function isEmergency(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}
