import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { courseStore } from "../store/courseStore";
import type { Course, QuizQuestion } from "../store/courseStore";
import { authStore } from "../store/authStore";

type NewType = QuizQuestion["type"];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function emptyQuestion(type: NewType): QuizQuestion {
  const base = {
    id: uid("q"),
    type,
    prompt: "",
    points: 1,
  } as const;

  if (type === "mcq") {
    return { ...base, type: "mcq", options: ["", ""], answerIndex: 0 };
  }
  if (type === "tf") {
    return { ...base, type: "tf", answer: true };
  }
  return { ...base, type: "short", answerText: "" };
}

export default function AdminQuizEditor() {
  const nav = useNavigate();
  const { courseId } = useParams();
  const [refresh, setRefresh] = useState(0);

  const course = useMemo(() => (courseId ? courseStore.getCourseById(courseId) : undefined), [courseId, refresh]);
  const [selectedQ, setSelectedQ] = useState<string>("");

  function save(next: Course) {
    courseStore.upsertCourse(next);
    setRefresh((r) => r + 1);
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="text-sm text-slate-600 dark:text-slate-300">Course not found.</div>
            <div className="mt-4">
              <Link className="text-sm font-semibold underline" to="/admin/courses">
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questions = course.quiz || [];
  const selected = questions.find((q) => q.id === selectedQ) || questions[0];

  function updateSelected(patch: Partial<QuizQuestion>) {
    if (!selected) return;
    const next: Course = {
      ...course,
      quiz: questions.map((q) => (q.id === selected.id ? ({ ...q, ...patch } as QuizQuestion) : q)),
    };
    save(next);
  }

  function addQuestion(type: NewType) {
    const q = emptyQuestion(type);
    const next: Course = { ...course, quiz: [...questions, q] };
    save(next);
    setSelectedQ(q.id);
  }

  function deleteQuestion(id: string) {
    const next: Course = { ...course, quiz: questions.filter((q) => q.id !== id) };
    save(next);
    setSelectedQ(next.quiz[0]?.id || "");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Admin • Quiz Editor (5.3)</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Kurs: <span className="font-semibold">{course.title}</span> • Çoktan seçmeli + Doğru/Yanlış + Kısa cevap
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/courses"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              ← Course Editor
            </Link>

            <button
              type="button"
              onClick={() => {
                authStore.logout();
                nav("/login");
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Questions</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion("mcq")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                >
                  + MCQ
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("tf")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                >
                  + T/F
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("short")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                >
                  + Short
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {questions.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                  Bu kursta henüz soru yok.
                </div>
              )}
              {questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQ(q.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition dark:border-white/10 ${
                    q.id === (selected?.id || "")
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="line-clamp-2">{q.prompt?.trim() ? q.prompt : "(Boş soru)"}</span>
                    <span
                      className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                        q.id === (selected?.id || "")
                          ? "border-white/20 bg-white/10 text-white dark:border-slate-300 dark:bg-slate-100 dark:text-slate-900"
                          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
                      }`}
                    >
                      {q.type.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            {!selected ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">Select a question.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">
                    Editing • <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-white/10 dark:bg-slate-950">{selected.type}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteQuestion(selected.id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-4 grid gap-4">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Prompt</span>
                    <textarea
                      value={selected.prompt}
                      onChange={(e) => updateSelected({ prompt: e.target.value })}
                      className="min-h-[96px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-white/10"
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Points</span>
                    <input
                      type="number"
                      min={1}
                      value={selected.points || 1}
                      onChange={(e) => updateSelected({ points: Math.max(1, Number(e.target.value || 1)) })}
                      className="w-28 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-white/10"
                    />
                  </label>

                  {selected.type === "mcq" && (
                    <div className="grid gap-3">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Options</div>
                      {(selected.options || []).map((opt, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-2">
                          <input
                            className="h-4 w-4"
                            type="radio"
                            checked={selected.answerIndex === idx}
                            onChange={() => updateSelected({ answerIndex: idx } as any)}
                          />
                          <input
                            value={opt}
                            onChange={(e) => {
                              const next = [...selected.options];
                              next[idx] = e.target.value;
                              updateSelected({ options: next } as any);
                            }}
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-white/10"
                            placeholder={`Option ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = selected.options.filter((_, i) => i !== idx);
                              const nextAns = Math.min(selected.answerIndex, Math.max(0, next.length - 1));
                              updateSelected({ options: next, answerIndex: nextAns } as any);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateSelected({ options: [...selected.options, ""] } as any)}
                        className="w-fit rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                      >
                        + Add option
                      </button>
                    </div>
                  )}

                  {selected.type === "tf" && (
                    <div className="grid gap-2">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Correct answer</div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            checked={selected.answer === true}
                            onChange={() => updateSelected({ answer: true } as any)}
                          />
                          <span>True</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            checked={selected.answer === false}
                            onChange={() => updateSelected({ answer: false } as any)}
                          />
                          <span>False</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {selected.type === "short" && (
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected answer (auto-check: exact, case-insensitive)</span>
                      <input
                        value={selected.answerText}
                        onChange={(e) => updateSelected({ answerText: e.target.value } as any)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-white/10"
                        placeholder="e.g. single page application"
                      />
                    </label>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                    Not: PDF'teki “farklı soru tipleri” gereksinimi için 3 tip demo edilmiştir. İstersen ileride eşleştirme / boşluk doldurma / sürükle-bırak gibi tipler de eklenebilir.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
