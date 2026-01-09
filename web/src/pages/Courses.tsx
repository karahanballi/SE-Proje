import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { courseStore } from "../store/courseStore";
import { authStore } from "../store/authStore";

function LockBadge({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <span className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      Locked
    </span>
  );
}

function PrereqBadge({ missing }: { missing: boolean }) {
  if (!missing) return null;
  return (
    <span className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
      Prereq
    </span>
  );
}

export default function Courses() {
  const { t } = useTranslation();
  const nav = useNavigate();

  const [refresh, setRefresh] = useState(0);
  const courses = useMemo(() => courseStore.getCourses(), [refresh]);
  const completed = useMemo(() => courseStore.getCompletedCourseIds(), [refresh]);

  function logout() {
    authStore.logout();
    nav("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t("coursesTitle")}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("coursesSubtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/courses"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Admin Panel
            </Link>

            <button
              type="button"
              onClick={() => {
                courseStore.resetToDefaults();
                setRefresh((r) => r + 1);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Reset Demo
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
            >
              {t("logout")}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {courses.map((c) => {
            const lock = courseStore.isCourseLockedForUser(c.id);
            const missingPrereq = courseStore.hasMissingPrerequisites(c.id);
            const outsideWindow = courseStore.isCourseOutsideAccessWindow(c.id);
            const done = completed.includes(c.id);
            const blocked = lock || missingPrereq || outsideWindow;

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{c.title}</h3>
                      <LockBadge locked={lock} />
                      <PrereqBadge missing={missingPrereq} />
                      {done && (
                        <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                          Completed
                        </span>
                      )}
                    </div>
                    <div
                      className="mt-1 text-sm text-slate-600 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: c.descriptionHtml || c.description }}
                    />
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {c.modules.length} {t("modules")} • {c.modules.reduce((acc, m) => acc + m.items.length, 0)} {t("items")}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={blocked ? "#" : `/course/${c.id}`}
                      onClick={(e) => {
                        if (blocked) e.preventDefault();
                      }}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        blocked
                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-slate-950 dark:text-slate-600"
                          : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                      }`}
                    >
                      {t("openCourse")}
                    </Link>

                    {blocked && (
                      <button
                        type="button"
                        onClick={() => {
                          if (outsideWindow) {
                            alert(courseStore.getAccessWindowMessage(c.id) || "Ders erişim aralığı dışında.");
                            return;
                          }
                          if (missingPrereq) {
                            alert(courseStore.getPrereqMessage(c.id));
                            return;
                          }
                          const pw = window.prompt("Course password (demo):");
                          if (pw == null) return;
                          const ok = courseStore.unlockCourse(c.id, pw);
                          if (!ok) alert("Wrong password");
                          setRefresh((r) => r + 1);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        {outsideWindow ? "Access" : missingPrereq ? "View prereq" : "Unlock"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
