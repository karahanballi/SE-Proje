import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authStore } from "../store/authStore";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t("common.siteTitle");
  }, [t, i18n.language]);

  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => u.trim().length > 0 && p.trim().length > 0, [u, p]);

  function toggleLanguage() {
    const current = i18n.language?.startsWith("en") ? "en" : "tr";
    i18n.changeLanguage(current === "tr" ? "en" : "tr");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const next = params.get("next") || "/courses";

    // Demo credentials
    if (p === "1234" && u === "admin") {
      authStore.login("admin", "admin");
      nav(next.startsWith("/") ? next : "/courses");
      return;
    }

    if (p === "1234" && (u === "student" || u === "user")) {
      authStore.login(u, "student");
      nav(next.startsWith("/admin") ? "/courses" : next);
      return;
    }
    setErr(t("auth.errorInvalid"));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 hidden sm:block dark:hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-200 blur-3xl" />
        <div className="absolute -bottom-40 left-10 h-[520px] w-[520px] rounded-full bg-emerald-200 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-pink-200 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-10 h-[520px] w-[520px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-[520px] w-[520px] rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                  <span className="text-lg font-bold">L</span>
                </div>

                <div>
                  <h1 className="text-xl font-semibold">{t("auth.appTitle")}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t("auth.subtitle")}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleLanguage}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50
                           dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-950/60"
                aria-label={t("common.language")}
                title={t("common.language")}
              >
                {(i18n.language?.startsWith("en") ? "EN" : "TR") as string}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Demo</div>
              <div className="mt-1 flex flex-wrap gap-2">
              
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-4 grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {t("auth.usernameLabel")}
                </span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10
                             dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-white/10"
                  value={u}
                  onChange={(e) => setU(e.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  autoComplete="username"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {t("auth.passwordLabel")}
                </span>
                <input
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10
                             dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-white/10"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  type="password"
                  autoComplete="current-password"
                />
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-1 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50
                           dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                {t("auth.loginButton")}
              </button>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                  {err}
                </div>
              )}
            </form>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{t("auth.footerLeft")}</span>
              <span>{t("auth.footerRight")}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("auth.bottomNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
