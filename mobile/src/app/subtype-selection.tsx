import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DISEASES } from "../constants/diseases";

export default function SubtypeSelectionScreen() {
  const { diseaseId, uri, width, height } = useLocalSearchParams<{
    diseaseId?: string;
    uri?: string;
    width?: string;
    height?: string;
  }>();

  const disease = DISEASES.find((item) => item.id === diseaseId);

  // expo-router auto-decodes params on read (exactly once) — this is already
  // the real file path. Do NOT decode again. Only re-encode when pushing forward.
  const imageUri = Array.isArray(uri) ? uri[0] : uri;

  if (!disease) {
    return (
      <View style={styles.container}>
        <Text>Disease not found.</Text>
      </View>
    );
  }

  const handleSubtypeSelect = (subtype: string) => {
    console.log("========== SUBTYPE SELECTED ==========");
    console.log("Disease:", disease.name);
    console.log("Subtype:", subtype);
    console.log("Image URI:", imageUri);

    router.push({
      pathname: "/upload-summary",
      params: {
        diseaseId: disease.id,
        diseaseName: disease.name,
        subtypeName: subtype,
        uri: imageUri ? encodeURIComponent(imageUri) : "",
        width: width ?? "",
        height: height ?? "",
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Text style={styles.title}>{disease.name}</Text>

      <Text style={styles.subtitle}>Select the image subtype.</Text>

      <View style={styles.list}>
        {disease.subtypes.map((subtype) => (
          <Pressable
            key={subtype}
            style={styles.card}
            onPress={() => handleSubtypeSelect(subtype)}
          >
            <Text style={styles.cardTitle}>{subtype}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
  },

  list: {
    marginTop: 25,
    gap: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
});
