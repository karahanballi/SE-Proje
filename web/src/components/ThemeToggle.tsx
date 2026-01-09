import { useTheme } from "../theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={() => {
  toggle();
  console.log("html class:", document.documentElement.className);
}}

      className="fixed right-4 top-4 z-50 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100
                 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      type="button"
      aria-label="Toggle theme"
      title="Tema değiştir"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
