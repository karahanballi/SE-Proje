import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function CourseDetail() {
  const { id } = useLocalSearchParams();
  const courseId = String(id ?? "1");

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 8 }}>
        Ders Detayı
      </Text>

      <Text style={{ marginBottom: 24 }}>Ders ID: {courseId}</Text>

      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/quiz", params: { courseId } })
        }
        style={{
          backgroundColor: "#16a34a",
          padding: 14,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          Quiz&apos;e Başla
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push({ pathname: "/omr", params: { courseId } })
        }
        style={{
          backgroundColor: "#9333ea",
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          Optik Okuyucu (OMR)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
