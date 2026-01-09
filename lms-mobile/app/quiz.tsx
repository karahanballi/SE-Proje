import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";

type Option = "A" | "B" | "C" | "D";
type Question = {
  id: number;
  text: string;
  options: { key: Option; label: string }[];
  correct: Option;
};

function buildQuestions(courseId: string): Question[] {
  return [
    {
      id: 1,
      text: "React Native ne için kullanılır?",
      options: [
        { key: "A", label: "Mobil uygulama geliştirme" },
        { key: "B", label: "Veritabanı yönetimi" },
        { key: "C", label: "İşletim sistemi yazmak" },
        { key: "D", label: "GPU sürücüsü yazmak" },
      ],
      correct: "A",
    },
    {
      id: 2,
      text: "LMS içinde 'Course (Ders)' en doğru neyi temsil eder?",
      options: [
        { key: "A", label: "Tek bir sınav" },
        { key: "B", label: "İçerik + aktiviteler bütünü" },
        { key: "C", label: "Sadece video" },
        { key: "D", label: "Sadece not listesi" },
      ],
      correct: "B",
    },
    {
      id: 3,
      text: "Çoktan seçmeli sorularda otomatik puanlamanın avantajı nedir?",
      options: [
        { key: "A", label: "Elle kontrol zorunlu" },
        { key: "B", label: "Hızlı ve tutarlı değerlendirme" },
        { key: "C", label: "İnternet hızını artırır" },
        { key: "D", label: "Disk boyutunu düşürür" },
      ],
      correct: "B",
    },
    {
      id: 4,
      text: "Dark mode temel olarak neyi iyileştirir?",
      options: [
        { key: "A", label: "CPU hızını" },
        { key: "B", label: "Görsel konfor ve erişilebilirlik" },
        { key: "C", label: "RAM kapasitesini" },
        { key: "D", label: "Wi-Fi çekim gücünü" },
      ],
      correct: "B",
    },
    {
      id: 5,
      text: "i18n neyi ifade eder?",
      options: [
        { key: "A", label: "Tek dil desteği" },
        { key: "B", label: "Uluslararasılaştırma (çok dil)" },
        { key: "C", label: "Şifreleme" },
        { key: "D", label: "Dosya sıkıştırma" },
      ],
      correct: "B",
    },
    {
      id: 6,
      text: "Expo Go ile demo yapmanın avantajı nedir?",
      options: [
        { key: "A", label: "Store’a yüklemeden hızlı test" },
        { key: "B", label: "Sadece iOS çalışır" },
        { key: "C", label: "Kamera hiç çalışmaz" },
        { key: "D", label: "Kod yazmadan uygulama üretir" },
      ],
      correct: "A",
    },
    {
      id: 7,
      text: "OMR modülünde ilk adım genelde nedir?",
      options: [
        { key: "A", label: "Ses kaydı" },
        { key: "B", label: "Görüntü alma (kamera/galeri)" },
        { key: "C", label: "E-posta gönderme" },
        { key: "D", label: "VPN açma" },
      ],
      correct: "B",
    },
    {
      id: 8,
      text: "Safe Exam Browser (SEB) temel amaç olarak ne sağlar?",
      options: [
        { key: "A", label: "Tarayıcıyı oyun moduna alır" },
        { key: "B", label: "Sınavda kontrollü/kısıtlı ortam" },
        { key: "C", label: "Ders videosu indirir" },
        { key: "D", label: "GPU hız aşırtır" },
      ],
      correct: "B",
    },
    {
      id: 9,
      text: "SPA (Single Page Application) ne demektir?",
      options: [
        { key: "A", label: "Her sayfa ayrı exe" },
        { key: "B", label: "Tek uygulama, route ile geçiş" },
        { key: "C", label: "Sadece server-side render" },
        { key: "D", label: "Sadece mobil uygulama" },
      ],
      correct: "B",
    },
    {
      id: 10,
      text: "Lighthouse skorları web için neyi ölçer?",
      options: [
        { key: "A", label: "Hava durumu" },
        { key: "B", label: "Performans/SEO/Erişilebilirlik vb." },
        { key: "C", label: "Telefon şarjı" },
        { key: "D", label: "RAM voltajı" },
      ],
      correct: "B",
    },
    {
      id: 11,
      text: "Quiz’de timer (zamanlayıcı) ne işe yarar?",
      options: [
        { key: "A", label: "Soruları siler" },
        { key: "B", label: "Süreyi sınırlar" },
        { key: "C", label: "Kamerayı açar" },
        { key: "D", label: "Telefonu kapatır" },
      ],
      correct: "B",
    },
    {
      id: 12,
      text: "Ders içerik türlerine örnek hangisi olabilir?",
      options: [
        { key: "A", label: "PDF / Video" },
        { key: "B", label: "BIOS" },
        { key: "C", label: "GPU sürücüsü" },
        { key: "D", label: "Kablo" },
      ],
      correct: "A",
    },
    {
      id: 13,
      text: "Electron masaüstü uygulaması hangi fikri destekler?",
      options: [
        { key: "A", label: "Web teknolojileriyle desktop app" },
        { key: "B", label: "Sadece kernel yazma" },
        { key: "C", label: "Sadece driver geliştirme" },
        { key: "D", label: "Sadece oyun motoru" },
      ],
      correct: "A",
    },
    {
      id: 14,
      text: "Kullanıcı rollerine örnek hangisi doğru?",
      options: [
        { key: "A", label: "Öğrenci / Eğitmen / Yönetici" },
        { key: "B", label: "GPU / CPU" },
        { key: "C", label: "RAM / SSD" },
        { key: "D", label: "HDMI / USB" },
      ],
      correct: "A",
    },
    {
      id: 15,
      text: `Ders ${courseId}: Bu soru türü nedir?`,
      options: [
        { key: "A", label: "Çoktan seçmeli" },
        { key: "B", label: "Kod çalıştırma" },
        { key: "C", label: "Uzun cevap" },
        { key: "D", label: "Dosya yükleme" },
      ],
      correct: "A",
    },
  ];
}

export default function Quiz() {
  const { courseId: rawCourseId } = useLocalSearchParams<{ courseId?: string }>();
  const courseId = String(rawCourseId ?? "1");
  const questions = useMemo(() => buildQuestions(courseId), [courseId]);

  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Option | null>>(() => {
    const init: Record<number, Option | null> = {};
    for (const q of questions) init[q.id] = null;
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  const current = questions[index];

  const computed = useMemo(() => {
    let correct = 0;
    let blank = 0;

    for (const q of questions) {
      const a = answers[q.id];
      if (!a) {
        blank++;
        continue;
      }
      if (a === q.correct) correct++;
    }

    const wrong = total - correct - blank;
    const percent = Math.round((correct / total) * 100);

    return { correct, wrong, blank, percent };
  }, [answers, questions, total]);

  if (submitted) {
    return (
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 12 }}>
          Quiz Sonucu
        </Text>

        <Text style={{ fontSize: 18, marginBottom: 6 }}>Ders: {courseId}</Text>
        <Text style={{ fontSize: 18, marginBottom: 6 }}>
          Doğru: {computed.correct} / {total}
        </Text>
        <Text style={{ fontSize: 18, marginBottom: 6 }}>Yanlış: {computed.wrong}</Text>
        <Text style={{ fontSize: 18, marginBottom: 6 }}>Boş: {computed.blank}</Text>
        <Text style={{ fontSize: 18, marginBottom: 16 }}>Puan: {computed.percent}</Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/omr",
              params: { courseId, qCount: String(total) },
            })
          }
          style={{ backgroundColor: "#111827", padding: 14, borderRadius: 8, marginBottom: 10 }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Optik Oku (OMR)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: "#2563eb", padding: 14, borderRadius: 8 }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Derse Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
        Quiz ({total} Soru)
      </Text>
      <Text style={{ marginBottom: 16 }}>Ders: {courseId}</Text>

      <Text style={{ marginBottom: 8 }}>
        {index + 1} / {total}
      </Text>

      <Text style={{ fontSize: 18, marginBottom: 16 }}>{current.text}</Text>

      {current.options.map((opt) => {
        const picked = answers[current.id] === opt.key;
        return (
          <TouchableOpacity
            key={`${current.id}-${opt.key}`}
            onPress={() => setAnswers((p) => ({ ...p, [current.id]: opt.key }))}
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: picked ? "#dbeafe" : "transparent",
            }}
          >
            <Text>
              {opt.key}) {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => setIndex((v) => Math.max(0, v - 1))}
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            flex: 1,
            opacity: index === 0 ? 0.5 : 1,
          }}
          disabled={index === 0}
        >
          <Text style={{ textAlign: "center" }}>Geri</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIndex((v) => Math.min(total - 1, v + 1))}
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            flex: 1,
            opacity: index === total - 1 ? 0.5 : 1,
          }}
          disabled={index === total - 1}
        >
          <Text style={{ textAlign: "center" }}>İleri</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setSubmitted(true)}
        style={{ marginTop: 16, backgroundColor: "#16a34a", padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>Bitir ve Sonucu Gör</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 8, opacity: 0.7 }}>
        Not: Boş bıraktığın sorular “boş” sayılır.
      </Text>
    </View>
  );
}
