import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { courseStore } from "../store/courseStore";
import ProctoringRecorder from "../components/ProctoringRecorder";

async function goFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // ignore
  }
}

export default function Quiz() {
  const { id } = useParams();
  const { t } = useTranslation();

  const course = useMemo(() => (id ? courseStore.getCourseById(id) : undefined), [id]);

  const [started, setStarted] = useState(false);
  const [proctorActive, setProctorActive] = useState(false);
  const [proctorBlobUrl, setProctorBlobUrl] = useState<string | null>(null);

  // quiz state
  const quiz = course?.quiz || [];
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [shortAnswer, setShortAnswer] = useState("");

  // sınav bittiğinde proctoring durdur
  useEffect(() => {
    if (done) setProctorActive(false);
  }, [done]);

  // sayfadan çıkarken blob url temizle
  useEffect(() => {
    return () => {
      if (proctorBlobUrl) URL.revokeObjectURL(proctorBlobUrl);
    };
  }, [proctorBlobUrl]);

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          {t("notFoundQuiz")}
        </div>
      </div>
    );
  }

  const courseId = course.id;
  const courseTitle = course.title;

  const totalPoints = useMemo(
    () => quiz.reduce((acc, q) => acc + (typeof q.points === "number" ? q.points : 1), 0),
    [quiz]
  );

  if (quiz.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">Bu derste quiz yok (demo).</p>
          <div className="mt-4">
            <Link
              to={`/course/${courseId}`}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
            >
              {t("goCourse")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz[idx];
  const qPoints = typeof q.points === "number" ? q.points : 1;

  function gradeAndAdvance(isCorrect: boolean) {
    const nextScore = score + (isCorrect ? qPoints : 0);
    const nextIdx = idx + 1;

    if (nextIdx >= quiz.length) {
      setScore(nextScore);
      setDone(true);

      const pass = nextScore >= Math.ceil(totalPoints * 0.6);
      if (pass) courseStore.setCourseCompleted(courseId, true);
      setShortAnswer("");
    } else {
      setScore(nextScore);
      setIdx(nextIdx);
      setShortAnswer("");
    }
  }

  function submitMCQ(choice: number) {
    if (q.type !== "mcq") return;
    gradeAndAdvance(choice === q.answerIndex);
  }

  function submitTF(value: boolean) {
    if (q.type !== "tf") return;
    gradeAndAdvance(value === q.answer);
  }

  function submitShort() {
    if (q.type !== "short") return;
    const a = shortAnswer.trim().toLowerCase();
    const exp = (q.answerText || "").trim().toLowerCase();
    gradeAndAdvance(a.length > 0 && a === exp);
  }

  // ✅ Start screen (kamera + fullscreen burada)
  if (!started && !done) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl p-6">
          <Link
            to={`/course/${courseId}`}
            className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300"
          >
            {t("backToCourse")}
          </Link>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h1 className="text-xl font-semibold">Sınavı Başlat</h1>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Başlatınca tam ekran açılır ve kamera kaydı (demo) başlar.
            </p>

            <div className="mt-4">
              <ProctoringRecorder
                active={proctorActive}
                onStop={(blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    setProctorBlobUrl(url);
                  }
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  await goFullscreen();
                  setProctorBlobUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                  });
                  setProctorActive(true);
                  setStarted(true);
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                Başlat
              </button>

              {proctorBlobUrl && (
                <a
                  href={proctorBlobUrl}
                  download="proctoring.webm"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100
                             dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Önceki kaydı indir
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Done screen (kayıt indir linki eklendi)
  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <h1 className="text-2xl font-semibold">{t("resultTitle")}</h1>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              {t("scoreLine", { course: courseTitle, score, total: totalPoints })}
            </p>

            <div
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900
                            dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              {t("successBox")}
            </div>

            {proctorBlobUrl && (
              <div className="mt-4">
                <a
                  href={proctorBlobUrl}
                  download="proctoring.webm"
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800
                             dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                >
                  Proctoring kaydını indir (demo)
                </a>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={`/course/${courseId}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100
                           dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t("goCourse")}
              </Link>
              <Link
                to="/courses"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800
                           dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                {t("goCourses")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Exam screen (küçük proctor kutusu sağ üstte)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <Link
            to={`/course/${courseId}`}
            className="text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300"
            onClick={(e) => {
              // sınav ortasında kazara çıkmayı azalt
              if (!done) {
                const ok = confirm("Sınav devam ediyor. Çıkmak istiyor musun?");
                if (!ok) e.preventDefault();
              }
            }}
          >
            {t("backToCourse")}
          </Link>

          <div className="w-[340px] shrink-0">
            <ProctoringRecorder
              active={proctorActive}
              onStop={(blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setProctorBlobUrl(url);
                }
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{t("quizTitle")}</h1>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {t("questionNOfM", { n: idx + 1, m: quiz.length })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950">
            <h3 className="text-base font-semibold">{q.prompt}</h3>

            {q.type === "mcq" && (
              <div className="mt-3 grid gap-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => submitMCQ(i)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-100
                               dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    {opt || `Option ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            {q.type === "tf" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => submitTF(true)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  True
                </button>
                <button
                  onClick={() => submitTF(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  False
                </button>
              </div>
            )}

            {q.type === "short" && (
              <div className="mt-3 grid gap-2">
                <input
                  value={shortAnswer}
                  onChange={(e) => setShortAnswer(e.target.value)}
                  placeholder="Answer"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-white/10"
                />
                <button
                  type="button"
                  onClick={submitShort}
                  className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                >
                  Submit
                </button>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
              {t("demoCalc")} • Puan: {qPoints}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
