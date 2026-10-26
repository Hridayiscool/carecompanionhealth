import type React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Lang } from "./i18n";

export type FamilyContact = { name: string; phone: string };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: { [K in keyof (typeof dict)["en"]]: string };
  meds: string[];
  setMeds: (m: string[]) => void;
  contacts: FamilyContact[];
  setContacts: (c: FamilyContact[]) => void;
};

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __ccAppCtx?: React.Context<Ctx | null> };
const AppCtx = (g.__ccAppCtx ??= createContext<Ctx | null>(null));

const fallback: Ctx = {
  lang: "en", setLang: () => {}, t: dict.en, meds: [], setMeds: () => {},
  contacts: [], setContacts: () => {},
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [meds, setMeds] = useState<string[]>([]);

  useEffect(() => {
    const l = localStorage.getItem("cc-lang");
    if (l === "ar" || l === "en") setLang(l);
    try {
      setMeds(JSON.parse(localStorage.getItem("cc-meds") ?? "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("cc-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const saveMeds = (m: string[]) => {
    setMeds(m);
    localStorage.setItem("cc-meds", JSON.stringify(m));
  };

  return (
    <AppCtx.Provider value={{ lang, setLang, t: dict[lang], meds, setMeds: saveMeds }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  return c ?? fallback;
}
