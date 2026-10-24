import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Lang } from "./i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof dict)["en"];
  meds: string[];
  setMeds: (m: string[]) => void;
};

const AppCtx = createContext<Ctx | null>(null);

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
  if (!c) throw new Error("useApp outside provider");
  return c;
}
