import type { Lang } from "./i18n";

export function speak(text: string, lang: Lang, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : "en-US";
  u.rate = 0.9;
  u.onend = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRecognition(lang: Lang): any | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W = window as any;
  const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = lang === "ar" ? "ar-SA" : "en-US";
  r.interimResults = false;
  r.maxAlternatives = 1;
  return r;
}
