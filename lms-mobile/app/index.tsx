import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>
        LMS Mobil Uygulaması
      </Text>

      <Text style={{ marginVertical: 20 }}>Hoş Geldiniz</Text>

      <TouchableOpacity
        onPress={() => router.push("/login")}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff" }}>Giriş Yap</Text>
      </TouchableOpacity>
    </View>
  );
}
