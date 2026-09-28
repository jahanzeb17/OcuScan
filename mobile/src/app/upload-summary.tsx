import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { getAccessToken } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

// const API_BASE_URL = "http://172.16.2.22:8000";

export default function UploadSummaryScreen() {
  const params = useLocalSearchParams<{
    diseaseId?: string;
    diseaseName?: string;
    subtypeName?: string;
    uri?: string;
    width?: string;
    height?: string;
  }>();

  const { diseaseId, diseaseName, subtypeName, uri, width, height } = params;

  // expo-router auto-decodes params on read (exactly once), so this is already
  // the real, correct file path. Do NOT decode again — that was corrupting the
  // path (e.g. turning the literal "%40anonymous%2F..." folder-name text into
  // real "@" and "/" characters that don't exist on disk).
  const imageUri = Array.isArray(uri) ? uri[0] : uri;

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const timestamp = new Date();

  const datePart = timestamp.toISOString().slice(0, 10).replace(/-/g, "");

  const timePart = timestamp.toTimeString().slice(0, 8).replace(/:/g, "");

  const diseasePart = (diseaseName ?? "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const subtypePart = (subtypeName ?? "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const filename = `${diseasePart}_${subtypePart}_${datePart}_${timePart}.jpg`;

  const handleUpload = async () => {
    if (!imageUri) {
      setMessage("Image URI is missing.");
      return;
    }

    if (!diseaseId) {
      setMessage("Disease is missing.");
      return;
    }

    if (!subtypeName) {
      setMessage("Subtype is missing.");
      return;
    }

    if (!width || !height) {
      setMessage("Image dimensions are missing.");
      return;
    }

    try {
      setUploading(true);
      setMessage("Uploading image...");

      console.log("================================");
      console.log("STARTING ANDROID UPLOAD");
      console.log("================================");

      console.log("API URL:", `${API_BASE_URL}/upload`);

      console.log("Image URI:", imageUri);

      console.log("Disease ID:", diseaseId);

      console.log("Disease Name:", diseaseName);

      console.log("Subtype:", subtypeName);

      console.log("Filename:", filename);

      console.log("Width:", width);

      console.log("Height:", height);

      // ==================================================
      // UPLOAD USING EXPO FILE SYSTEM
      // ==================================================

      console.log("========== STARTING FILE UPLOAD ==========");

      const uploadUrl = `${API_BASE_URL}/upload`;

      const accessToken = await getAccessToken();

      if (!accessToken) {
        Alert.alert(
          "Login Required",
          "Please log in before uploading an image.",
        );

        router.replace("/login");
        return;
      }

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, imageUri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "image",
        mimeType: "image/jpeg",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },

        parameters: {
          disease: diseaseId,
          subtype: subtypeName,
          filename: filename,
          width: String(width),
          height: String(height),
        },
      });

      console.log("========== HTTP RESPONSE ==========");

      console.log("Status:", uploadResult.status);

      console.log("Response:", uploadResult.body);

      console.log("Headers:", uploadResult.headers);

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        let errorMessage = `Server returned HTTP ${uploadResult.status}`;

        try {
          const data = JSON.parse(uploadResult.body);

          if (Array.isArray(data?.detail)) {
            errorMessage = data.detail
              .map((item: any) => item?.msg || JSON.stringify(item))
              .join(", ");
          } else if (typeof data?.detail === "string") {
            errorMessage = data.detail;
          }
        } catch {
          if (uploadResult.body) {
            errorMessage = uploadResult.body;
          }
        }

        throw new Error(errorMessage);
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      let data: any = {};

      try {
        data = uploadResult.body ? JSON.parse(uploadResult.body) : {};
      } catch {
        console.log("Response was not JSON.");
      }

      console.log("========== UPLOAD SUCCESS ==========");

      console.log(data);

      setMessage("Image uploaded successfully.");

      setTimeout(() => {
        router.replace("/");
      }, 1200);
    } catch (error: any) {
      console.log("========== UPLOAD ERROR ==========");

      console.log(error);

      console.log("Error message:", error?.message);

      setMessage(`Upload failed: ${error?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>Image Ready</Text>

      <Text style={styles.label}>Disease</Text>

      <Text style={styles.value}>{diseaseName}</Text>

      <Text style={styles.label}>Subtype</Text>

      <Text style={styles.value}>{subtypeName}</Text>

      <Text style={styles.label}>Resolution</Text>

      <Text style={styles.value}>
        {width} × {height}
      </Text>

      <Text style={styles.label}>Filename</Text>

      <Text style={styles.filename}>{filename}</Text>

      <Pressable
        style={[styles.uploadButton, uploading && styles.disabledButton]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        )}
      </Pressable>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    padding: 25,
    paddingTop: 80,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 18,
  },

  value: {
    fontSize: 19,
    fontWeight: "600",
    marginTop: 5,
  },

  filename: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5,
    color: "#2563EB",
  },

  uploadButton: {
    marginTop: 40,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  message: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
