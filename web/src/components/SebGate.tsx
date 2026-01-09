import type { ReactNode } from "react";
import { useMemo } from "react";

function isSafeExamBrowserUA() {
  const ua = navigator.userAgent || "";
  return /SafeExamBrowser|SEB/i.test(ua);
}

export default function SebGate({
  children,
  allowNonSeb = false,
}: {
  children: ReactNode;
  allowNonSeb?: boolean;
}) {
  const inSeb = useMemo(() => isSafeExamBrowserUA(), []);

  if (allowNonSeb || inSeb) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h1 className="text-xl font-semibold">Bu sınav Safe Exam Browser ile açılmalı</h1>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          Güvenli sınav modu için bu sayfayı SEB içinde açman gerekiyor.
        </p>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          Demo: SEB algılama userAgent ile yapılıyor.
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
          >
            SEB ile açtıktan sonra Yenile
          </button>

          <button
            onClick={() => alert("Demo: .seb config indirme backend ile eklenecek.")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100
                       dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            .seb Config (demo)
          </button>
        </div>
      </div>
    </div>
  );
}
