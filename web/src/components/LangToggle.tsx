import i18n from "i18next";
import { useTranslation } from "react-i18next";

export default function LangToggle() {
  useTranslation(); // re-render

  const lang = i18n.language === "en" ? "en" : "tr";

  function toggle() {
    const next = lang === "tr" ? "en" : "tr";
    i18n.changeLanguage(next);
    localStorage.setItem("demo_lang", next);
  }

  return (
    <button
      onClick={toggle}
      className="fixed right-4 top-16 z-50 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100
                 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      type="button"
      title="Language"
    >
      {lang === "tr" ? "TR" : "EN"}
    </button>
  );
}
