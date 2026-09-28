import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  /*
   * Camera permission is still being checked.
   */
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>Checking camera permission...</Text>
      </View>
    );
  }

  /*
   * Camera permission has not been granted.
   */
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar style="dark" />

        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={44} color="#2563EB" />
        </View>

        <Text style={styles.permissionTitle}>Camera Access Required</Text>

        <Text style={styles.permissionDescription}>
          OcuScan needs access to your camera so you can capture eye images for
          the research dataset.
        </Text>

        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Ionicons name="camera" size={20} color="#FFFFFF" />

          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  /*
   * Capture photo.
   */
  const handleCapture = async () => {
    if (!cameraRef.current) {
      console.log("Camera reference is not available.");
      return;
    }

    if (!cameraReady) {
      console.log("Camera is not ready yet.");
      return;
    }

    if (isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);

      console.log("========== TAKING PHOTO ==========");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (!photo?.uri) {
        throw new Error("Camera did not return an image URI.");
      }

      console.log("========== PHOTO CAPTURED ==========");

      console.log("URI:", photo.uri);

      console.log("Width:", photo.width);

      console.log("Height:", photo.height);

      /*
       * Copy the temporary camera image into the app cache.
       *
       * This prevents the original Expo Go camera URI from
       * being altered while it passes through Expo Router.
       */
      console.log("========== COPYING CAMERA IMAGE ==========");

      const filename = `ocusscan_${Date.now()}.jpg`;

      const copiedUri = `${FileSystem.cacheDirectory}${filename}`;

      console.log("Original URI:", photo.uri);

      console.log("Copied URI:", copiedUri);

      await FileSystem.copyAsync({
        from: photo.uri,
        to: copiedUri,
      });

      console.log("========== IMAGE COPY COMPLETE ==========");

      console.log("Copied image URI:", copiedUri);

      /*
       * Send the copied image URI to the preview screen.
       */
      router.push({
        pathname: "/photo-preview",
        params: {
          uri: encodeURIComponent(copiedUri),
          width: String(photo.width ?? ""),
          height: String(photo.height ?? ""),
        },
      });
    } catch (error) {
      console.error("========== CAMERA ERROR ==========", error);

      Alert.alert(
        "Camera Error",
        "We could not capture the image. Please try again.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ================= CAMERA ================= */}

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="picture"
        flash="off"
        autofocus="on"
        onCameraReady={() => {
          console.log("========== CAMERA READY ==========");
          setCameraReady(true);
        }}
      />

      {/* ================= TOP BAR ================= */}

      <View style={styles.topBar}>
        <Pressable style={styles.topButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.topTitle}>Capture Eye Image</Text>

        <View style={styles.topButtonPlaceholder} />
      </View>

      {/* ================= EYE GUIDE ================= */}

      <View style={styles.guideContainer}>
        <View style={styles.eyeGuide}>
          {/* Top left */}
          <View style={[styles.corner, styles.topLeft]} />

          {/* Top right */}
          <View style={[styles.corner, styles.topRight]} />

          {/* Bottom left */}
          <View style={[styles.corner, styles.bottomLeft]} />

          {/* Bottom right */}
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.guideText}>
          <Text style={styles.guideTitle}>
            Position the eye inside the frame
          </Text>

          <Text style={styles.guideSubtitle}>
            Keep the eye clear and in focus
          </Text>
        </View>
      </View>

      {/* ================= BOTTOM ================= */}

      <View style={styles.bottomContainer}>
        <Text style={styles.instruction}>
          Use the rear camera for image collection
        </Text>

        {/* Capture button */}

        <Pressable
          style={({ pressed }) => [
            styles.captureOuter,
            pressed && styles.capturePressed,
            (!cameraReady || isCapturing) && styles.captureDisabled,
          ]}
          onPress={handleCapture}
          disabled={!cameraReady || isCapturing}
        >
          <View style={styles.captureInner}>
            {isCapturing ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Ionicons name="camera" size={30} color="#2563EB" />
            )}
          </View>
        </Pressable>

        <Text style={styles.captureStatus}>
          {isCapturing
            ? "Capturing..."
            : cameraReady
              ? "Tap to capture"
              : "Starting camera..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
  },

  /* ================= PERMISSION ================= */

  centerContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748B",
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  permissionIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  permissionDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 340,
  },

  permissionButton: {
    marginTop: 28,
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  cancelButton: {
    marginTop: 14,
    height: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  /* ================= TOP BAR ================= */

  topBar: {
    position: "absolute",
    top: 50,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  topButtonPlaceholder: {
    width: 44,
    height: 44,
  },

  topTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  /* ================= GUIDE ================= */

  guideContainer: {
    position: "absolute",
    top: "25%",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  eyeGuide: {
    width: 300,
    height: 190,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  guideText: {
    marginTop: 18,
    alignItems: "center",
    paddingHorizontal: 25,
  },

  guideTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  guideSubtitle: {
    marginTop: 5,
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    textAlign: "center",
  },

  /* ================= BOTTOM ================= */

  bottomContainer: {
    position: "absolute",
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  instruction: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    marginBottom: 18,
  },

  captureOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },

  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  capturePressed: {
    transform: [{ scale: 0.93 }],
  },

  captureDisabled: {
    opacity: 0.6,
  },

  captureStatus: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
