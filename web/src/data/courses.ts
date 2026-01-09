export type Course = {
  id: string;
  title: string;
  description: string;
  units: { id: string; title: string; type: "video" | "pdf" }[];
  quiz: { id: string; question: string; options: string[]; answerIndex: number }[];
};

export const COURSES: Course[] = [
  {
    id: "SE2025",
    title: "SE2025 - Yazılım Mühendisliği",
    description: "Giriş dersleri ve mini sınav.",
    units: [
      { id: "u1", title: "Hafta 1: Giriş (Video)", type: "video" },
      { id: "u2", title: "Hafta 1: Notlar (PDF)", type: "pdf" },
      { id: "u3", title: "Hafta 2: Gereksinimler (Video)", type: "video" },
      { id: "u4", title: "Hafta 2: Özet (PDF)", type: "pdf" },
    ],
    quiz: [
      {
        id: "q1",
        question: "LMS ne işe yarar?",
        options: ["Oyun oynatır", "Öğrenmeyi yönetir", "Antivirüs tarar"],
        answerIndex: 1,
      },
      {
        id: "q2",
        question: "Frontend için seçtiğimiz teknoloji?",
        options: ["React", "Django", "Laravel"],
        answerIndex: 0,
      },
      {
        id: "q3",
        question: "Bu veriler nereden geliyor?",
        options: ["Cloud DB", "Local JSON/TS", "Harici API"],
        answerIndex: 1,
      },
      {
        id: "q4",
        question: "SPA ne demektir?",
        options: ["Single Page Application", "Server Push API", "Secure Password Auth"],
        answerIndex: 0,
      },
      {
        id: "q5",
        question: "Dark/Light mode hangi amaçla var?",
        options: ["Sadece süs", "Erişilebilirlik ve UX", "Antivirüs"],
        answerIndex: 1,
      },
    ],
  },
  {
    id: "db101",
    title: "DB101 - Veritabanı Temelleri",
    description: "İkinci ders.",
    units: [
      { id: "u1", title: "Hafta 1: SQL (PDF)", type: "pdf" },
      { id: "u2", title: "Hafta 1: SELECT/WHERE (Video)", type: "video" },
      { id: "u3", title: "Hafta 2: JOIN (PDF)", type: "pdf" },
    ],
    quiz: [
      {
        id: "q1",
        question: "PostgreSQL bir ...",
        options: ["Veritabanı", "Tarayıcı", "Oyun motoru"],
        answerIndex: 0,
      },
      {
        id: "q2",
        question: "SELECT ne yapar?",
        options: ["Veri okur", "PC kapatır", "Resim çizer"],
        answerIndex: 0,
      },
      {
        id: "q3",
        question: "Local kullanım için DB şart mı?",
        options: ["Evet", "Hayır"],
        answerIndex: 1,
      },
      {
        id: "q4",
        question: "Primary key neyi sağlar?",
        options: ["Tekillik", "Rastgelelik", "Şifreleme"],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "web101",
    title: "WEB101 - Web Geliştirme",
    description: "Routing, component yapısı ve UI temelleri.",
    units: [
      { id: "u1", title: "Hafta 1: HTML/CSS (PDF)", type: "pdf" },
      { id: "u2", title: "Hafta 1: React Bileşenleri (Video)", type: "video" },
      { id: "u3", title: "Hafta 2: Router (PDF)", type: "pdf" },
    ],
    quiz: [
      {
        id: "q1",
        question: "Route ne işe yarar?",
        options: ["Sayfalar arası geçiş", "GPU hızlandırma", "Şifre kırma"],
        answerIndex: 0,
      },
      {
        id: "q2",
        question: "Component nedir?",
        options: ["Yeniden kullanılabilir UI parçası", "DB tablosu", "Dosya uzantısı"],
        answerIndex: 0,
      },
      {
        id: "q3",
        question: "Vite ne sağlar?",
        options: ["Hızlı dev/build", "Veri tabanı", "Mail sunucusu"],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "sec101",
    title: "SEC101 - Güvenlik Temelleri",
    description: "Kimlik doğrulama ve temel güvenlik kavramları.",
    units: [
      { id: "u1", title: "Hafta 1: Auth/Session (Video)", type: "video" },
      { id: "u2", title: "Hafta 1: OWASP Top 10 (PDF)", type: "pdf" },
    ],
    quiz: [
      {
        id: "q1",
        question: "XSS nedir?",
        options: ["Tarayıcı tarafı saldırı", "Veri tabanı", "CSS framework"],
        answerIndex: 0,
      },
      {
        id: "q2",
        question: "Güçlü şifre için hangisi doğru?",
        options: ["123456", "Karmaşık ve uzun", "Sadece ad-soyad"],
        answerIndex: 1,
      },
      {
        id: "q3",
        question: "Local auth nerede tutuluyor?",
        options: ["localStorage", "BIOS", "CD-ROM"],
        answerIndex: 0,
      },
    ],
  },
];
