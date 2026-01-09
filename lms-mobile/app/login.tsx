import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";
import { router } from "expo-router";

const DEMO_USER = "student";
const DEMO_PASS = "1234";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onLogin = () => {
    setErr(null);

    if (!username.trim() || !password.trim()) {
      setErr("Kullanıcı adı ve şifre boş olamaz.");
      return;
    }

    if (username !== DEMO_USER || password !== DEMO_PASS) {
      setErr("Hatalı giriş. Demo: student / 1234");
      return;
    }

    router.replace("/courses");
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 24 }}>
        Giriş Yap
      </Text>

      {err && (
        <Text style={{ marginBottom: 12, color: "#b91c1c" }}>{err}</Text>
      )}

      <Text>Kullanıcı Adı</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Demo: student"
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      />

      <Text>Şifre</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Demo: 1234"
        secureTextEntry
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
        }}
      />

      <TouchableOpacity
        onPress={onLogin}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>Giriş Yap</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 12, opacity: 0.7 }}>
        Demo hesap: student / 1234
      </Text>
    </View>
  );
}
