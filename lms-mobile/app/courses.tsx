import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Courses() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 24 }}>
        Derslerim
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/course/1")}
        style={{
          padding: 16,
          borderWidth: 1,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>Yazılım Mühendisliği</Text>
        <Text>Quiz + İçerik</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/course/2")}
        style={{
          padding: 16,
          borderWidth: 1,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 18 }}>Veri Yapıları</Text>
        <Text>Quiz + İçerik</Text>
      </TouchableOpacity>
    </View>
  );
}
