import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { courseStore } from "../store/courseStore";
import type { Course, CourseItem, ContentType } from "../store/courseStore";
import { authStore } from "../store/authStore";

function exec(cmd: string) {
  // eslint-disable-next-line deprecation/deprecation
  document.execCommand(cmd);
}

function clamp(str: string, n: number) {
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

type DragPayload = { kind: "item"; courseId: string; moduleId: string; itemId: string };

function encode(payload: DragPayload) {
  return JSON.stringify(payload);
}

function decode(raw: string | null): DragPayload | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as DragPayload;
    if (p.kind !== "item") return null;
    return p;
  } catch {
    return null;
  }
}

function emptyCourse(): Course {
  return {
    id: `course_${Date.now().toString(16)}`,
    title: "Yeni Ders",
    description: "",
    descriptionHtml: "",
    prerequisites: [],
    access: {},
    modules: [{ id: `m_${Date.now().toString(16)}`, title: "Modül 1", items: [] }],
    quiz: [],
  };
}

export default function AdminCourses() {
  const nav = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const courses = useMemo(() => courseStore.getCourses(), [refresh]);
  const templates = useMemo(() => courseStore.getTemplates(), []);

  const [selectedId, setSelectedId] = useState<string>(() => courses[0]?.id || "");
  const selected = useMemo(() => courseStore.getCourseById(selectedId), [selectedId, refresh]);

  useEffect(() => {
    if (!selectedId && courses[0]) setSelectedId(courses[0].id);
  }, [courses, selectedId]);

  function save(course: Course) {
    courseStore.upsertCourse(course);
    setRefresh((r) => r + 1);
  }

  function addModule(course: Course) {
    const next: Course = {
      ...course,
      modules: [...course.modules, { id: `m_${Date.now().toString(16)}`, title: "Yeni Modül", items: [] }],
    };
    save(next);
  }

  function addItem(course: Course, moduleId: string, type: ContentType) {
    const titleByType: Record<ContentType, string> = {
      video: "Yeni Video",
      pdf: "Yeni PDF",
      scorm: "Yeni SCORM",
      h5p: "Yeni H5P",
    };
    const item: CourseItem = {
      id: `i_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
      title: titleByType[type],
      type,
      source: type === "pdf" ? "/sample.pdf" : type === "video" ? "/sample.mp4" : "",
    };

    const next: Course = {
      ...course,
      modules: course.modules.map((m) => (m.id === moduleId ? { ...m, items: [...m.items, item] } : m)),
    };
    save(next);
  }

  function onDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData("application/json", encode(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  function moveItem(course: Course, fromModuleId: string, itemId: string, toModuleId: string, toIndex: number) {
    if (fromModuleId === toModuleId) {
      const m = course.modules.find((x) => x.id === fromModuleId);
      if (!m) return;
      const fromIndex = m.items.findIndex((i) => i.id === itemId);
      if (fromIndex === -1) return;
      const items = [...m.items];
      const [it] = items.splice(fromIndex, 1);
      const target = Math.max(0, Math.min(toIndex, items.length));
      items.splice(target, 0, it);
      save({ ...course, modules: course.modules.map((x) => (x.id === m.id ? { ...x, items } : x)) });
      return;
    }

    const from = course.modules.find((x) => x.id === fromModuleId);
    const to = course.modules.find((x) => x.id === toModuleId);
    if (!from || !to) return;
    const idx = from.items.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const fromItems = [...from.items];
    const [it] = fromItems.splice(idx, 1);
    const toItems = [...to.items];
    const target = Math.max(0, Math.min(toIndex, toItems.length));
    toItems.splice(target, 0, it);

    const next: Course = {
      ...course,
      modules: course.modules.map((m) => {
        if (m.id === from.id) return { ...m, items: fromItems };
        if (m.id === to.id) return { ...m, items: toItems };
        return m;
      }),
    };
    save(next);
  }

  function onDropOnModule(e: React.DragEvent, course: Course, toModuleId: string) {
    e.preventDefault();
    const payload = decode(e.dataTransfer.getData("application/json"));
    if (!payload || payload.courseId !== course.id) return;
    const toModule = course.modules.find((m) => m.id === toModuleId);
    if (!toModule) return;
    moveItem(course, payload.moduleId, payload.itemId, toModuleId, toModule.items.length);
  }

  function onDropOnItem(
    e: React.DragEvent,
    course: Course,
    toModuleId: string,
    beforeItemId: string
  ) {
    e.preventDefault();
    const payload = decode(e.dataTransfer.getData("application/json"));
    if (!payload || payload.courseId !== course.id) return;
    const toModule = course.modules.find((m) => m.id === toModuleId);
    if (!toModule) return;
    const index = toModule.items.findIndex((i) => i.id === beforeItemId);
    if (index === -1) return;
    moveItem(course, payload.moduleId, payload.itemId, toModuleId, index);
  }

  const [newPrereq, setNewPrereq] = useState<string>("");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Admin • Ders Yönetimi (5.2)</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Kurs oluşturma, hiyerarşik modüller, içerik türleri ve sürükle-bırak düzenleme.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/courses"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              ← Courses
            </Link>

            <button
              type="button"
              onClick={() => {
                if (selectedId) nav(`/admin/quizzes/${selectedId}`);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Quiz Editor (5.3)
            </button>
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
          {/* Left: course list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Courses</h2>
              <button
                type="button"
                onClick={() => {
                  const c = emptyCourse();
                  courseStore.upsertCourse(c);
                  setSelectedId(c.id);
                  setRefresh((r) => r + 1);
                }}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                + New
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition dark:border-white/10 ${
                    c.id === selectedId
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {clamp(c.title, 42)}
                  <div className={`mt-1 text-xs ${c.id === selectedId ? "text-white/80 dark:text-slate-700" : "text-slate-500 dark:text-slate-400"}`}>
                    {c.modules.length} modules • {c.modules.reduce((a, m) => a + m.items.length, 0)} items
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Templates</div>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      courseStore.createFromTemplate(t.id);
                      setRefresh((r) => r + 1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-950/60"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            {!selected ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">Select a course.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[240px] flex-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Title</label>
                    <input
                      value={selected.title}
                      onChange={(e) => save({ ...selected, title: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-white/10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        courseStore.duplicateCourse(selected.id);
                        setRefresh((r) => r + 1);
                      }}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-950/60"
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm("Delete course?")) return;
                        courseStore.deleteCourse(selected.id);
                        setSelectedId(courseStore.getCourses()[0]?.id || "");
                        setRefresh((r) => r + 1);
                      }}
                      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => nav(`/admin/quizzes/${selected.id}`)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-950/60"
                    >
                      Quiz Editor (5.3)
                    </button>
                  </div>
                </div>

                {/* WYSIWYG */}
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description (WYSIWYG)</div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => exec("bold")} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60">
                        B
                      </button>
                      <button type="button" onClick={() => exec("italic")} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60">
                        I
                      </button>
                      <button type="button" onClick={() => exec("underline")} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60">
                        U
                      </button>
                    </div>
                  </div>

                  <div
                    className="mt-2 min-h-[92px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-white/10"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const html = (e.currentTarget as HTMLDivElement).innerHTML;
                      save({ ...selected, descriptionHtml: html, description: html.replace(/<[^>]+>/g, " ").trim() });
                    }}
                    dangerouslySetInnerHTML={{ __html: selected.descriptionHtml || selected.description }}
                  />
                </div>

                {/* prerequisites + access */}
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="text-sm font-semibold">Prerequisites</div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Demo: Kurs tamamlanmadan diğer kurslar kilitli kalır.</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selected.prerequisites || []).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => save({ ...selected, prerequisites: (selected.prerequisites || []).filter((x) => x !== p) })}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-950/60"
                          title="Remove"
                        >
                          {courseStore.getCourseById(p)?.title || p} ×
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <select
                        value={newPrereq}
                        onChange={(e) => setNewPrereq(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">Select course…</option>
                        {courses
                          .filter((c) => c.id !== selected.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPrereq) return;
                          const set = new Set(selected.prerequisites || []);
                          set.add(newPrereq);
                          save({ ...selected, prerequisites: Array.from(set) });
                          setNewPrereq("");
                        }}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="text-sm font-semibold">Access control</div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tarih / şifre ile erişim kısıtı (demo).</p>

                    <div className="mt-3 grid gap-2">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Start date</span>
                        <input
                          type="date"
                          value={selected.access?.startAt || ""}
                          onChange={(e) => save({ ...selected, access: { ...(selected.access || {}), startAt: e.target.value || undefined } })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">End date</span>
                        <input
                          type="date"
                          value={selected.access?.endAt || ""}
                          onChange={(e) => save({ ...selected, access: { ...(selected.access || {}), endAt: e.target.value || undefined } })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password (optional)</span>
                        <input
                          value={selected.access?.password || ""}
                          onChange={(e) => save({ ...selected, access: { ...(selected.access || {}), password: e.target.value || undefined } })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="e.g. se"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* modules */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Modules</h2>
                    <button
                      type="button"
                      onClick={() => addModule(selected)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-950/60"
                    >
                      + Module
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {selected.modules.map((m) => (
                      <div
                        key={m.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropOnModule(e, selected, m.id)}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <input
                            value={m.title}
                            onChange={(e) => {
                              const next: Course = {
                                ...selected,
                                modules: selected.modules.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)),
                              };
                              save(next);
                            }}
                            className="w-full flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => addItem(selected, m.id, "video")}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                            >
                              + Video
                            </button>
                            <button
                              type="button"
                              onClick={() => addItem(selected, m.id, "pdf")}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                            >
                              + PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => addItem(selected, m.id, "scorm")}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                            >
                              + SCORM
                            </button>
                            <button
                              type="button"
                              onClick={() => addItem(selected, m.id, "h5p")}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                            >
                              + H5P
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (selected.modules.length <= 1) return;
                                const ok = confirm("Remove module? (items will be lost)");
                                if (!ok) return;
                                const next: Course = { ...selected, modules: selected.modules.filter((x) => x.id !== m.id) };
                                save(next);
                              }}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-950/60"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mt-3 grid gap-2">
                          {m.items.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                              Drop items here or add from buttons above.
                            </div>
                          ) : (
                            m.items.map((it) => (
                              <div
                                key={it.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, { kind: "item", courseId: selected.id, moduleId: m.id, itemId: it.id })}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDropOnItem(e, selected, m.id, it.id)}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex min-w-[220px] flex-1 flex-wrap items-center gap-2">
                                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                                      {it.type.toUpperCase()}
                                    </span>
                                    <input
                                      value={it.title}
                                      onChange={(e) => {
                                        const next: Course = {
                                          ...selected,
                                          modules: selected.modules.map((mm) =>
                                            mm.id !== m.id
                                              ? mm
                                              : {
                                                  ...mm,
                                                  items: mm.items.map((x) => (x.id === it.id ? { ...x, title: e.target.value } : x)),
                                                }
                                          ),
                                        };
                                        save(next);
                                      }}
                                      className="w-full flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next: Course = {
                                        ...selected,
                                        modules: selected.modules.map((mm) =>
                                          mm.id !== m.id
                                            ? mm
                                            : { ...mm, items: mm.items.filter((x) => x.id !== it.id) }
                                        ),
                                      };
                                      save(next);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                  >
                                    Remove
                                  </button>
                                </div>

                                {(it.type === "scorm" || it.type === "h5p") && (
                                  <div className="mt-2 grid gap-1">
                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Source (URL/Embed)</div>
                                    <input
                                      value={it.source || ""}
                                      onChange={(e) => {
                                        const next: Course = {
                                          ...selected,
                                          modules: selected.modules.map((mm) =>
                                            mm.id !== m.id
                                              ? mm
                                              : {
                                                  ...mm,
                                                  items: mm.items.map((x) => (x.id === it.id ? { ...x, source: e.target.value } : x)),
                                                }
                                          ),
                                        };
                                        save(next);
                                      }}
                                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                                      placeholder="https://..."
                                    />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
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
