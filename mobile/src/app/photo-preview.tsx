import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function PhotoPreviewScreen() {
  const { uri, width, height } = useLocalSearchParams<{
    uri?: string;
    width?: string;
    height?: string;
  }>();

  // expo-router auto-decodes params on read (exactly once), so `uri` here is
  // already the real, correct file path. Do NOT decode it again.
  const imageUri = Array.isArray(uri) ? uri[0] : uri;

  console.log("========== PHOTO PREVIEW ==========");
  console.log("Image URI:", imageUri);

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No image found.</Text>

        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Photo Preview</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
          onLoad={() => console.log("========== IMAGE LOADED ==========")}
          onError={(error) =>
            console.log("========== IMAGE ERROR ==========", error.nativeEvent)
          }
        />
      </View>

      <Text style={styles.resolution}>
        {width && height ? `${width} × ${height}` : "Resolution unavailable"}
      </Text>

      <Pressable
        style={styles.cropImageButton}
        onPress={() => {
          router.push({
            pathname: "/crop-image",
            params: {
              uri: encodeURIComponent(imageUri),
              width: width ?? "",
              height: height ?? "",
            },
          });
        }}
      >
        <Text style={styles.cropImageButtonText}>Crop Image</Text>
      </Pressable>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.retakeButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.useButton]}
          onPress={() => {
            router.push({
              pathname: "/disease-selection",
              params: {
                uri: encodeURIComponent(imageUri),
                width: width ?? "",
                height: height ?? "",
              },
            });
          }}
        >
          <Text style={styles.buttonText}>Use Image</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  resolution: {
    color: "#aaa",
    textAlign: "center",
    marginVertical: 12,
  },

  cropImageButton: {
    backgroundColor: "#555",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  cropImageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  buttons: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 30,
  },

  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#333",
  },

  retakeButton: {
    backgroundColor: "#444",
  },

  useButton: {
    backgroundColor: "#007AFF",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },
});
