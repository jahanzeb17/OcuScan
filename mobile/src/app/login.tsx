import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useState } from "react";

import { saveAccessToken } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

// const API_BASE_URL = "http://172.16.2.22:8000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert("Login Required", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const body =
        `username=${encodeURIComponent(cleanEmail)}` +
        `&password=${encodeURIComponent(password)}`;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.detail ?? "Unable to login.");
        return;
      }

      if (!data.success || !data.access_token) {
        Alert.alert(
          "Login Failed",
          data.message ?? "Invalid email or password.",
        );
        return;
      }

      await saveAccessToken(data.access_token);

      console.log("========== LOGIN SUCCESS ==========");
      console.log("Doctor ID:", data.doctor.doctor_id);
      console.log("Doctor:", data.doctor.name);
      console.log("Role:", data.doctor.role);

      router.replace("/");
    } catch (error) {
      console.log("========== LOGIN ERROR ==========", error);

      Alert.alert(
        "Connection Error",
        "Could not connect to the OcuScan server.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.card}>
        <Text style={styles.logo}>OcuScan</Text>

        <Text style={styles.title}>Doctor Login</Text>

        <Text style={styles.subtitle}>Sign in to upload eye images</Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="doctor@example.com"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={styles.registerButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerButtonText}>Register as Doctor</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
  },
  title: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  registerButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "700",
  },
});
