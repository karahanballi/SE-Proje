export type ContentType = "video" | "pdf" | "scorm" | "h5p";

export type CourseItem = {
  id: string;
  title: string;
  type: ContentType;
  // Demo: For SCORM/H5P we keep a URL/embed string; for video/pdf we use sample files.
  source?: string;
};

export type CourseModule = {
  id: string;
  title: string;
  items: CourseItem[];
};

export type CourseAccess = {
  startAt?: string; // ISO date
  endAt?: string; // ISO date
  password?: string;
  allowedGroups?: string[]; // demo
};

export type Course = {
  id: string;
  title: string;
  description: string;
  // WYSIWYG html (optional). If empty, fall back to description.
  descriptionHtml?: string;
  modules: CourseModule[];
  prerequisites?: string[];
  access?: CourseAccess;

  quiz: QuizQuestion[];
};

export type QuizQuestionBase = {
  id: string;
  type: "mcq" | "tf" | "short";
  prompt: string;
  points?: number;
};

export type QuizQuestionMCQ = QuizQuestionBase & {
  type: "mcq";
  options: string[];
  answerIndex: number;
};

export type QuizQuestionTF = QuizQuestionBase & {
  type: "tf";
  answer: boolean;
};

export type QuizQuestionShort = QuizQuestionBase & {
  type: "short";
  answerText: string;
};

export type QuizQuestion = QuizQuestionMCQ | QuizQuestionTF | QuizQuestionShort;

const LS_KEY = "lms_courses_v1";
const LS_COMPLETED = "lms_completed_courses_v1";
const LS_UNLOCKED = "lms_unlocked_courses_v1";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeQuiz(course: Course): Course {
  const q = (course.quiz || []) as any[];
  const normalized: QuizQuestion[] = q
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      // Old format: {id, question, options, answerIndex}
      if (typeof it.type !== "string" && typeof it.question === "string") {
        return {
          id: String(it.id || uid("q")),
          type: "mcq" as const,
          prompt: it.question,
          options: Array.isArray(it.options) ? it.options.map(String) : [],
          answerIndex: Number(it.answerIndex || 0),
        };
      }
      if (it.type === "mcq") {
        return {
          id: String(it.id || uid("q")),
          type: "mcq" as const,
          prompt: String(it.prompt || ""),
          options: Array.isArray(it.options) ? it.options.map(String) : [],
          answerIndex: Number(it.answerIndex || 0),
          points: typeof it.points === "number" ? it.points : undefined,
        };
      }
      if (it.type === "tf") {
        return {
          id: String(it.id || uid("q")),
          type: "tf" as const,
          prompt: String(it.prompt || ""),
          answer: Boolean(it.answer),
          points: typeof it.points === "number" ? it.points : undefined,
        };
      }
      if (it.type === "short") {
        return {
          id: String(it.id || uid("q")),
          type: "short" as const,
          prompt: String(it.prompt || ""),
          answerText: String(it.answerText || ""),
          points: typeof it.points === "number" ? it.points : undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as QuizQuestion[];

  // Small migration helpers (demo requirements)
  const nextId = course.id === "se101" ? "SE2025" : course.id;
  const nextTitle = course.id === "se101" ? "SE2025 - Yazılım Mühendisliği" : course.title;
  const nextPrereq = (course.prerequisites || []).map((p) => (p === "se101" ? "SE2025" : p));
  const nextAccess = course.access
    ? { ...course.access, password: course.access.password ? "1234" : course.access.password }
    : course.access;

  return { ...course, id: nextId, title: nextTitle, prerequisites: nextPrereq, access: nextAccess, quiz: normalized };
}

const DEFAULT_COURSES: Course[] = [
  {
    id: "SE2025",
    title: "SE2025 - Yazılım Mühendisliği",
    description: "Giriş dersleri ve mini sınav.",
    descriptionHtml:
      "<p><strong>SE2025</strong> dersinde gereksinim analizi, tasarım ve temel proje akışı özetlenir.</p>",
    prerequisites: [],
    access: {
      // demo: password lock
      password: "1234",
    },
    modules: [
      {
        id: "m1",
        title: "Modül 1: Giriş",
        items: [
          { id: "u1", title: "Hafta 1: Giriş (Video)", type: "video" },
          { id: "u2", title: "Hafta 1: Notlar (PDF)", type: "pdf" },
        ],
      },
      {
        id: "m2",
        title: "Modül 2: Gereksinimler",
        items: [
          { id: "u3", title: "Hafta 2: Gereksinimler (Video)", type: "video" },
          { id: "u4", title: "Hafta 2: Özet (PDF)", type: "pdf" },
          { id: "u5", title: "Demo: SCORM paket (Link)", type: "scorm", source: "https://example.com/scorm" },
        ],
      },
    ],
    quiz: [
      {
        id: "q1",
        type: "mcq",
        prompt: "LMS ne işe yarar?",
        options: ["Oyun oynatır", "Öğrenmeyi yönetir", "Antivirüs tarar"],
        answerIndex: 1,
      },
      {
        id: "q2",
        type: "tf",
        prompt: "React bir frontend kütüphanesidir.",
        answer: true,
      },
      {
        id: "q3",
        type: "short",
        prompt: "SPA açılımını yazınız.",
        answerText: "single page application",
      },
    ],
  },
  {
    id: "db101",
    title: "DB101 - Veritabanı Temelleri",
    description: "İkinci ders.",
    prerequisites: ["SE2025"],
    access: {
      startAt: "2025-01-01",
    },
    modules: [
      {
        id: "m1",
        title: "Modül 1: SQL",
        items: [
          { id: "u1", title: "Hafta 1: SQL (PDF)", type: "pdf" },
          { id: "u2", title: "Hafta 1: SELECT/WHERE (Video)", type: "video" },
        ],
      },
      {
        id: "m2",
        title: "Modül 2: JOIN",
        items: [{ id: "u3", title: "Hafta 2: JOIN (PDF)", type: "pdf" }],
      },
    ],
    quiz: [
      {
        id: "q1",
        type: "mcq",
        prompt: "PostgreSQL bir ...",
        options: ["Veritabanı", "Tarayıcı", "Oyun motoru"],
        answerIndex: 0,
      },
      {
        id: "q2",
        type: "mcq",
        prompt: "SELECT ne yapar?",
        options: ["Veri okur", "PC kapatır", "Resim çizer"],
        answerIndex: 0,
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "Local kullanım için DB şart mı?",
        options: ["Evet", "Hayır"],
        answerIndex: 1,
      },
      {
        id: "q4",
        type: "mcq",
        prompt: "Primary key neyi sağlar?",
        options: ["Tekillik", "Rastgelelik", "Şifreleme"],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "web101",
    title: "WEB101 - Web Geliştirme",
    description: "Routing, component yapısı ve UI temelleri.",
    prerequisites: [],
    modules: [
      {
        id: "m1",
        title: "Modül 1: Temeller",
        items: [
          { id: "u1", title: "Hafta 1: HTML/CSS (PDF)", type: "pdf" },
          { id: "u2", title: "Hafta 1: React Bileşenleri (Video)", type: "video" },
        ],
      },
      {
        id: "m2",
        title: "Modül 2: Router",
        items: [
          { id: "u3", title: "Hafta 2: Router (PDF)", type: "pdf" },
          { id: "u4", title: "Demo: H5P etkinliği (Embed)", type: "h5p", source: "https://example.com/h5p" },
        ],
      },
    ],
    quiz: [
      {
        id: "q1",
        type: "mcq",
        prompt: "Route ne işe yarar?",
        options: ["Sayfalar arası geçiş", "GPU hızlandırma", "Şifre kırma"],
        answerIndex: 0,
      },
      {
        id: "q2",
        type: "mcq",
        prompt: "Component nedir?",
        options: ["Yeniden kullanılabilir UI parçası", "DB tablosu", "Dosya uzantısı"],
        answerIndex: 0,
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "Vite ne sağlar?",
        options: ["Hızlı dev/build", "Veri tabanı", "Mail sunucusu"],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "sec101",
    title: "SEC101 - Güvenlik Temelleri",
    description: "Kimlik doğrulama ve temel güvenlik kavramları.",
    prerequisites: [],
    modules: [
      {
        id: "m1",
        title: "Modül 1: Auth",
        items: [
          { id: "u1", title: "Hafta 1: Auth/Session (Video)", type: "video" },
          { id: "u2", title: "Hafta 1: OWASP Top 10 (PDF)", type: "pdf" },
        ],
      },
    ],
    quiz: [
      {
        id: "q1",
        type: "mcq",
        prompt: "XSS nedir?",
        options: ["Tarayıcı tarafı saldırı", "Veri tabanı", "CSS framework"],
        answerIndex: 0,
      },
      {
        id: "q2",
        type: "mcq",
        prompt: "Güçlü şifre için hangisi doğru?",
        options: ["123456", "Karmaşık ve uzun", "Sadece ad-soyad"],
        answerIndex: 1,
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "Local auth nerede tutuluyor?",
        options: ["localStorage", "BIOS", "CD-ROM"],
        answerIndex: 0,
      },
    ],
  },
];

type Template = { id: string; title: string; build: () => Course };

const TEMPLATES: Template[] = [
  {
    id: "weekly",
    title: "Haftalık Ders Şablonu",
    build: () => {
      const id = uid("course");
      return {
        id,
        title: "Yeni Ders (Haftalık)",
        description: "Haftalara göre modül yapısı.",
        descriptionHtml: "<p><strong>Şablon:</strong> Haftalık ders yapısı.</p>",
        prerequisites: [],
        access: {},
        modules: [
          { id: uid("m"), title: "Hafta 1", items: [{ id: uid("i"), title: "Giriş (PDF)", type: "pdf" }] },
          { id: uid("m"), title: "Hafta 2", items: [{ id: uid("i"), title: "Konu (Video)", type: "video" }] },
        ],
        quiz: [],
      };
    },
  },
  {
    id: "exam",
    title: "Sınav Odaklı Şablon",
    build: () => {
      const id = uid("course");
      return {
        id,
        title: "Yeni Ders (Sınav)",
        description: "Kısa içerik + sınav.",
        descriptionHtml: "<p><strong>Şablon:</strong> Sınav odaklı ders.</p>",
        prerequisites: [],
        access: {},
        modules: [
          {
            id: uid("m"),
            title: "Hızlı Hazırlık",
            items: [
              { id: uid("i"), title: "Özet Notlar (PDF)", type: "pdf" },
              { id: uid("i"), title: "Demo H5P (Link)", type: "h5p", source: "https://example.com/h5p" },
            ],
          },
        ],
        quiz: [
          { id: uid("q"), type: "mcq", prompt: "Demo soru?", options: ["A", "B", "C"], answerIndex: 0 },
        ],
      };
    },
  },
];

export const courseStore = {
  ensureSeed() {
    const current = loadJson<Course[] | null>(LS_KEY, null);
    if (!current || !Array.isArray(current) || current.length === 0) {
      saveJson(LS_KEY, DEFAULT_COURSES);
    }
  },

  resetToDefaults() {
    saveJson(LS_KEY, DEFAULT_COURSES);
    saveJson(LS_COMPLETED, []);
    saveJson(LS_UNLOCKED, []);
  },

  getCourses(): Course[] {
    this.ensureSeed();
    const loaded = loadJson<Course[]>(LS_KEY, DEFAULT_COURSES);
    const normalized = loaded.map((c) => normalizeQuiz(c));
    // keep storage compatible (migration)
    if (JSON.stringify(loaded) !== JSON.stringify(normalized)) this.saveCourses(normalized);
    return normalized;
  },

  getCourseById(id: string): Course | undefined {
    return this.getCourses().find((c) => c.id === id);
  },

  saveCourses(courses: Course[]) {
    saveJson(LS_KEY, courses);
  },

  upsertCourse(course: Course) {
    const courses = this.getCourses();
    const idx = courses.findIndex((c) => c.id === course.id);
    if (idx === -1) courses.unshift(course);
    else courses[idx] = course;
    this.saveCourses(courses);
  },

  deleteCourse(id: string) {
    const courses = this.getCourses().filter((c) => c.id !== id);
    this.saveCourses(courses);
  },

  duplicateCourse(id: string) {
    const course = this.getCourseById(id);
    if (!course) return;
    const clone: Course = {
      ...course,
      id: uid("course"),
      title: `${course.title} (Kopya)`,
      modules: course.modules.map((m) => ({
        ...m,
        id: uid("m"),
        items: m.items.map((i) => ({ ...i, id: uid("i") })),
      })),
      quiz: course.quiz.map((q) => ({ ...q, id: uid("q") })),
    };
    this.upsertCourse(clone);
  },

  getTemplates() {
    return TEMPLATES.map((t) => ({ id: t.id, title: t.title }));
  },

  createFromTemplate(templateId: string) {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    this.upsertCourse(tpl.build());
  },

  // --- Progress / access ---
  getCompletedCourseIds(): string[] {
    return loadJson<string[]>(LS_COMPLETED, []);
  },

  setCourseCompleted(id: string, value: boolean) {
    const current = new Set(this.getCompletedCourseIds());
    if (value) current.add(id);
    else current.delete(id);
    saveJson(LS_COMPLETED, Array.from(current));
  },

  getUnlockedCourseIds(): string[] {
    return loadJson<string[]>(LS_UNLOCKED, []);
  },

  isCourseLockedForUser(courseId: string): boolean {
    const c = this.getCourseById(courseId);
    if (!c) return true;
    const pw = c.access?.password;
    if (!pw) return false;
    return !this.getUnlockedCourseIds().includes(courseId);
  },

  unlockCourse(courseId: string, password: string): boolean {
    const c = this.getCourseById(courseId);
    if (!c) return false;
    if (!c.access?.password) return true;
    if (password !== c.access.password) return false;
    const current = new Set(this.getUnlockedCourseIds());
    current.add(courseId);
    saveJson(LS_UNLOCKED, Array.from(current));
    return true;
  },

  isCourseOutsideAccessWindow(courseId: string): boolean {
    const c = this.getCourseById(courseId);
    if (!c) return true;

    const { startAt, endAt } = c.access || {};
    const now = Date.now();

    if (startAt) {
      const startMs = new Date(startAt).getTime();
      if (!Number.isNaN(startMs) && now < startMs) return true;
    }

    if (endAt) {
      const endMs = new Date(endAt).getTime();
      if (!Number.isNaN(endMs) && now > endMs) return true;
    }

    return false;
  },

  getAccessWindowMessage(courseId: string): string {
    const c = this.getCourseById(courseId);
    if (!c) return "";
    const { startAt, endAt } = c.access || {};
    if (!startAt && !endAt) return "";

    if (this.isCourseOutsideAccessWindow(courseId)) {
      const startTxt = startAt ? `Başlangıç: ${startAt}` : "";
      const endTxt = endAt ? `Bitiş: ${endAt}` : "";
      return ["Ders erişim aralığı dışında.", startTxt, endTxt].filter(Boolean).join(" ");
    }

    return "";
  },

  hasMissingPrerequisites(courseId: string): boolean {
    const c = this.getCourseById(courseId);
    if (!c) return true;
    const prereq = c.prerequisites || [];
    if (prereq.length === 0) return false;
    const done = new Set(this.getCompletedCourseIds());
    return prereq.some((p) => !done.has(p));
  },

  getPrereqMessage(courseId: string): string {
    const c = this.getCourseById(courseId);
    if (!c || !c.prerequisites || c.prerequisites.length === 0) return "";
    const names = c.prerequisites
      .map((id) => this.getCourseById(id)?.title || id)
      .join(", ");
    return `Ön koşul: ${names} tamamlanmadan bu derse girilemez.`;
  },
};
