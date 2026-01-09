import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  tr: {
    translation: {
      common: {
        language: "Dil",
        siteTitle: "LMS Demo",
      },

      auth: {
        appTitle: "LMS Demo",
        subtitle: "Local giriş ile hızlı demo",
        demoUser: "Kullanıcı:",
        demoPass: "Şifre:",
        usernameLabel: "Kullanıcı adı",
        usernamePlaceholder: "student",
        passwordLabel: "Şifre",
        passwordPlaceholder: "1234",
        loginButton: "Giriş Yap",
        errorInvalid: "Hatalı kullanıcı adı veya şifre. (student / 1234)",
        footerLeft: "Local demo •",
        footerRight: "Web / Desktop / Mobile",
        bottomNote: "Dark/Light mod farkı bu ekranda bariz görünür.",
      },

      coursesTitle: "Dersler",
      coursesSubtitle: "Ders listesi ve hızlı erişim",
      logout: "Çıkış Yap",

      modules: "modül",
      items: "içerik",
      openCourse: "Derse Gir",

      // Courses.tsx -> c.quiz.length gösteriyor (aslında soru sayısı)
      quizCount: "soru",
      contentCount: "İçerik",
      enterCourse: "Derse Gir",
      visualTest: "Bu kutu dark/light ve font kontrastını göstermek için var.",

      notFoundCourse: "Ders bulunamadı.",
      backToCourses: "← Derslere dön",
      quickInfoTitle: "Hızlı Bilgi",
      quickInfoValue: "Local demo içerikler",
      contentsTitle: "İçerikler",
      placeholderNote: "İçerikler demo amaçlı listelenmiştir.",
      miniQuizTitle: "Mini Quiz",
      instantScore: "Bu derste {{n}} soru var.",
      startQuiz: "Quiz Başlat",
      tip: "İpucu: Quiz ekranı demo amaçlıdır.",

      // Quiz.tsx için eksikler:
      notFoundQuiz: "Quiz bulunamadı.",
      backToCourse: "← Derse dön",
      quizTitle: "Quiz",
      questionNOfM: "{{n}} / {{m}}",
      resultTitle: "Sonuç",
      scoreLine: "{{course}} — Skor: {{score}}/{{total}}",
      successBox: "Tebrikler! Quiz tamamlandı.",
      goCourse: "Derse Git",
      goCourses: "Derslere Git",
      demoCalc: "Not: Bu alan demo metnidir.",
    },
  },

  en: {
    translation: {
      common: {
        language: "Language",
        siteTitle: "LMS Demo",
      },

      auth: {
        appTitle: "LMS Demo",
        subtitle: "Quick demo with local login",
        demoUser: "User:",
        demoPass: "Password:",
        usernameLabel: "Username",
        usernamePlaceholder: "student",
        passwordLabel: "Password",
        passwordPlaceholder: "1234",
        loginButton: "Sign In",
        errorInvalid: "Invalid username or password. (student / 1234)",
        footerLeft: "Local demo •",
        footerRight: "Web / Desktop / Mobile",
        bottomNote: "Dark/Light mode difference is clearly visible here.",
      },

      coursesTitle: "Courses",
      coursesSubtitle: "Course list and quick access",
      logout: "Logout",

      modules: "modules",
      items: "items",
      openCourse: "Open course",

      quizCount: "questions",
      contentCount: "Content",
      enterCourse: "Enter course",
      visualTest: "This box is here to clearly show dark/light contrast.",

      notFoundCourse: "Course not found.",
      backToCourses: "← Back to courses",
      quickInfoTitle: "Quick Info",
      quickInfoValue: "Local demo content",
      contentsTitle: "Contents",
      placeholderNote: "Contents are listed for demo purposes.",
      miniQuizTitle: "Mini Quiz",
      instantScore: "This course has {{n}} questions.",
      startQuiz: "Start Quiz",
      tip: "Tip: The quiz screen is for demo purposes.",

      notFoundQuiz: "Quiz not found.",
      backToCourse: "← Back to course",
      quizTitle: "Quiz",
      questionNOfM: "{{n}} / {{m}}",
      resultTitle: "Result",
      scoreLine: "{{course}} — Score: {{score}}/{{total}}",
      successBox: "Well done! Quiz completed.",
      goCourse: "Go to course",
      goCourses: "Go to courses",
      demoCalc: "Note: This area is demo text.",
    },
  },
} as const;

const savedLang = localStorage.getItem("app_lang");
const initialLang = savedLang === "en" || savedLang === "tr" ? savedLang : "tr";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "tr",
  supportedLngs: ["tr", "en"],
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("app_lang", lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = "ltr";
});

export default i18n;
