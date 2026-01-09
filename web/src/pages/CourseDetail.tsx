import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { courseStore } from "../store/courseStore";
import type { CourseItem } from "../store/courseStore";

function TypeBadge({ type }: { type: CourseItem["type"] }) {
  const label = type.toUpperCase();
  return (
    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
      {label}
    </span>
  );
}

function Viewer({ item }: { item: CourseItem }) {
  if (item.type === "pdf") {
    return (
      <div className="h-[60vh] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <iframe title={item.title} src={item.source || "/sample.pdf"} className="h-full w-full" />
      </div>
    );
  }

  if (item.type === "video") {
    const src = item.source;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
        {src ? (
          <video controls className="w-full rounded-xl">
            <source src={src} />
          </video>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
            Video kaynağı eklenmedi (demo). Admin panelinden içerik kaynağı (URL) girilebilir.
          </div>
        )}
      </div>
    );
  }

  // SCORM / H5P demo
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <div className="text-sm text-slate-700 dark:text-slate-300">
        Bu içerik türü <strong>{item.type.toUpperCase()}</strong> olarak tanımlandı.
      </div>
      {item.source ? (
        <a
          href={item.source}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
        >
          İçeriği aç (demo link)
        </a>
      ) : (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
          Kaynak URL eklenmedi. Admin panelinden SCORM/H5P için link/embed değeri girilebilir.
        </div>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const nav = useNavigate();

  const [refresh, setRefresh] = useState(0);
  const course = useMemo(() => (id ? courseStore.getCourseById(id) : undefined), [id, refresh]);
  const completed = useMemo(() => courseStore.getCompletedCourseIds(), [refresh]);

  const [active, setActive] = useState<CourseItem | null>(null);

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          {t("notFoundCourse")}
        </div>
      </div>
    );
  }

  const locked = courseStore.isCourseLockedForUser(course.id);
  const missingPrereq = courseStore.hasMissingPrerequisites(course.id);
  const outsideWindow = courseStore.isCourseOutsideAccessWindow(course.id);
  const isBlocked = locked || missingPrereq || outsideWindow;

  // Safety: if user navigates directly
  if (isBlocked) {
    const msg =
      (outsideWindow && courseStore.getAccessWindowMessage(course.id)) ||
      (missingPrereq && courseStore.getPrereqMessage(course.id)) ||
      (locked ? "Bu ders şifre ile kilitli." : "Bu derse erişilemiyor.");
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl p-6">
          <Link to="/courses" className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300">
            {t("backToCourses")}
          </Link>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h1 className="text-xl font-semibold">{course.title}</h1>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{msg}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {locked && !missingPrereq && !outsideWindow && (
                <button
                  type="button"
                  onClick={() => {
                    const pw = window.prompt("Course password (demo):");
                    if (pw == null) return;
                    const ok = courseStore.unlockCourse(course.id, pw);
                    if (!ok) {
                      alert("Wrong password");
                      return;
                    }
                    setRefresh((r) => r + 1);
                  }}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                >
                  Unlock
                </button>
              )}

              <button
                type="button"
                onClick={() => nav("/courses")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t("goCourses")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const done = completed.includes(course.id);
  const totalItems = course.modules.reduce((acc, m) => acc + m.items.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/courses" className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300">
              {t("backToCourses")}
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">{course.title}</h1>
            <div
              className="mt-2 text-sm text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: course.descriptionHtml || course.description }}
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {course.modules.length} {t("modules")} • {totalItems} {t("items")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/quiz/${course.id}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("startQuiz")}
            </Link>

            <button
              type="button"
              onClick={() => {
                courseStore.setCourseCompleted(course.id, !done);
                setRefresh((r) => r + 1);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                done
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/15"
                  : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              }`}
            >
              {done ? "Completed" : "Mark completed"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-base font-semibold">{t("contentsTitle")}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("placeholderNote")}
              </p>

              <div className="mt-4 grid gap-3">
                {course.modules.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                    <div className="text-sm font-semibold">{m.title}</div>
                    <div className="mt-2 grid gap-2">
                      {m.items.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setActive(it)}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                            active?.id === it.id
                              ? "border-slate-400 bg-slate-100 text-slate-900 dark:border-white/20 dark:bg-slate-950 dark:text-slate-100"
                              : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="truncate">{it.title}</span>
                          <TypeBadge type={it.type} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {active ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{active.title}</div>
                  <TypeBadge type={active.type} />
                </div>
                <Viewer item={active} />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                Soldan bir içerik seç.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              <div className="font-semibold">5.2 Demo Notu</div>
              <ul className="mt-2 list-disc pl-5 text-xs">
                <li>Hiyerarşik modül yapısı (Course → Modules → Items)</li>
                <li>İçerik türleri: Video, PDF, SCORM, H5P</li>
                <li>Ön koşul + erişim kontrolü (tarih/şifre) demo akışı</li>
                <li>Admin panelinde içerik ekleme ve düzenleme</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
