import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useState } from "react";
import { API_BASE_URL } from "../utils/api";

// const API_BASE_URL = "http://172.16.2.22:8000";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [qualification, setQualification] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      Alert.alert(
        "Registration Required",
        "Please enter your name, email and password.",
      );
      return;
    }

    if (experience.trim() && Number.isNaN(Number(experience.trim()))) {
      Alert.alert("Invalid Experience", "Experience must be a number.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", cleanName);
      formData.append("hospital", hospital.trim());
      formData.append("city", city.trim());

      if (experience.trim()) {
        formData.append("experience", experience.trim());
      }

      formData.append("qualification", qualification.trim());
      formData.append("designation", designation.trim());
      formData.append("email", cleanEmail);
      formData.append("password", password);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Registration Failed",
          data.detail ?? "Unable to create your account.",
        );
        return;
      }

      if (!data.success) {
        Alert.alert(
          "Registration Failed",
          data.message ?? "Unable to create your account.",
        );
        return;
      }

      Alert.alert(
        "Registration Successful",
        "Your doctor account has been created. Please log in.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/login"),
          },
        ],
      );
    } catch (error) {
      console.log("========== REGISTRATION ERROR ==========", error);

      Alert.alert(
        "Connection Error",
        "Could not connect to the OcuScan server.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>OcuScan</Text>

          <Text style={styles.title}>Doctor Registration</Text>

          <Text style={styles.subtitle}>
            Create your account to collect eye images
          </Text>

          <Text style={styles.label}>Name *</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Dr. John Doe"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Email *</Text>

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

          <Text style={styles.label}>Password *</Text>

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

          <Text style={styles.label}>Hospital</Text>

          <TextInput
            style={styles.input}
            value={hospital}
            onChangeText={setHospital}
            placeholder="Hospital name"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>City</Text>

          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Experience</Text>

          <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="Years of experience"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Qualification</Text>

          <TextInput
            style={styles.input}
            value={qualification}
            onChangeText={setQualification}
            placeholder="MBBS, FCPS, etc."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Designation</Text>

          <TextInput
            style={styles.input}
            value={designation}
            onChangeText={setDesignation}
            placeholder="Consultant, Doctor, etc."
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.roleNotice}>
            <Text style={styles.roleNoticeTitle}>Account type</Text>

            <Text style={styles.roleNoticeText}>
              New registrations are created as Doctor accounts. Admin access is
              controlled by the administrator.
            </Text>
          </View>

          <Pressable
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>
                Create Doctor Account
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/login")}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>
              Already have an account? Login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
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
    marginTop: 20,
    fontSize: 23,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  roleNotice: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginTop: 2,
    marginBottom: 18,
  },
  roleNoticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  roleNoticeText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#3B82F6",
  },
  registerButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    marginTop: 18,
    alignItems: "center",
  },
  backButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
});
