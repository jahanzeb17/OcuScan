import {
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_AREA_WIDTH = SCREEN_WIDTH - 40;

const MIN_CROP_SIZE = 120;
const HANDLE_SIZE = 60;

type ResizeHandle = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export default function CropImageScreen() {
  const { uri, width, height } = useLocalSearchParams<{
    uri?: string;
    width?: string;
    height?: string;
  }>();

  const imageUri = Array.isArray(uri) ? uri[0] : uri;

  const imageWidth = Number(width);
  const imageHeight = Number(height);

  const imageAspectRatio =
    imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;

  const displayWidth = IMAGE_AREA_WIDTH;

  const displayHeight =
    imageWidth > 0 && imageHeight > 0
      ? displayWidth / imageAspectRatio
      : displayWidth;

  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const [cropWidth, setCropWidth] = useState(displayWidth);

  const [cropHeight, setCropHeight] = useState(displayHeight);

  const [cropping, setCropping] = useState(false);

  const cropXRef = useRef(0);
  const cropYRef = useRef(0);

  const cropWidthRef = useRef(displayWidth);
  const cropHeightRef = useRef(displayHeight);

  const moveStartRef = useRef({
    x: 0,
    y: 0,
  });

  const resizeStartRef = useRef({
    width: displayWidth,
    height: displayHeight,
    x: 0,
    y: 0,
  });

  const activeHandleRef = useRef<ResizeHandle>("bottomRight");

  /*
   * MOVE CROP BOX
   */
  const moveResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        moveStartRef.current = {
          x: cropXRef.current,
          y: cropYRef.current,
        };
      },

      onPanResponderMove: (_, gesture) => {
        let newX = moveStartRef.current.x + gesture.dx;

        let newY = moveStartRef.current.y + gesture.dy;

        newX = Math.max(0, Math.min(newX, displayWidth - cropWidthRef.current));

        newY = Math.max(
          0,
          Math.min(newY, displayHeight - cropHeightRef.current),
        );

        cropXRef.current = newX;
        cropYRef.current = newY;

        setCropX(newX);
        setCropY(newY);
      },
    }),
  ).current;

  /*
   * RESIZE CROP BOX
   */
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        resizeStartRef.current = {
          width: cropWidthRef.current,
          height: cropHeightRef.current,
          x: cropXRef.current,
          y: cropYRef.current,
        };
      },

      onPanResponderMove: (_, gesture) => {
        const start = resizeStartRef.current;

        const handle = activeHandleRef.current;

        let newX = start.x;
        let newY = start.y;
        let newWidth = start.width;
        let newHeight = start.height;

        if (handle === "bottomRight") {
          newWidth = start.width + gesture.dx;

          newHeight = start.height + gesture.dy;
        }

        if (handle === "bottomLeft") {
          newX = start.x + gesture.dx;

          newWidth = start.width - gesture.dx;

          newHeight = start.height + gesture.dy;
        }

        if (handle === "topRight") {
          newY = start.y + gesture.dy;

          newWidth = start.width + gesture.dx;

          newHeight = start.height - gesture.dy;
        }

        if (handle === "topLeft") {
          newX = start.x + gesture.dx;

          newY = start.y + gesture.dy;

          newWidth = start.width - gesture.dx;

          newHeight = start.height - gesture.dy;
        }

        /*
         * Minimum size
         */
        if (newWidth < MIN_CROP_SIZE) {
          if (handle === "topLeft" || handle === "bottomLeft") {
            newX = start.x + start.width - MIN_CROP_SIZE;
          }

          newWidth = MIN_CROP_SIZE;
        }

        if (newHeight < MIN_CROP_SIZE) {
          if (handle === "topLeft" || handle === "topRight") {
            newY = start.y + start.height - MIN_CROP_SIZE;
          }

          newHeight = MIN_CROP_SIZE;
        }

        /*
         * Keep left/top inside image.
         */
        if (newX < 0) {
          newWidth += newX;
          newX = 0;
        }

        if (newY < 0) {
          newHeight += newY;
          newY = 0;
        }

        /*
         * Keep right/bottom inside image.
         */
        if (newX + newWidth > displayWidth) {
          newWidth = displayWidth - newX;
        }

        if (newY + newHeight > displayHeight) {
          newHeight = displayHeight - newY;
        }

        /*
         * Final minimum-size protection.
         */
        newWidth = Math.max(MIN_CROP_SIZE, newWidth);

        newHeight = Math.max(MIN_CROP_SIZE, newHeight);

        cropXRef.current = newX;
        cropYRef.current = newY;

        cropWidthRef.current = newWidth;
        cropHeightRef.current = newHeight;

        setCropX(newX);
        setCropY(newY);

        setCropWidth(newWidth);
        setCropHeight(newHeight);
      },
    }),
  ).current;

  const startResize = (handle: ResizeHandle) => {
    activeHandleRef.current = handle;
  };

  const handleCrop = async () => {
    if (!imageUri) {
      return;
    }

    if (!imageWidth || !imageHeight || !displayWidth || !displayHeight) {
      return;
    }

    try {
      setCropping(true);

      const scaleX = imageWidth / displayWidth;

      const scaleY = imageHeight / displayHeight;

      const originX = Math.round(cropXRef.current * scaleX);

      const originY = Math.round(cropYRef.current * scaleY);

      const cropWidthPixels = Math.round(cropWidthRef.current * scaleX);

      const cropHeightPixels = Math.round(cropHeightRef.current * scaleY);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidthPixels,
              height: cropHeightPixels,
            },
          },
        ],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      console.log("========== CROP SUCCESS ==========");

      console.log("Cropped URI:", result.uri);

      console.log("Cropped Width:", result.width);

      console.log("Cropped Height:", result.height);

      router.replace({
        pathname: "/photo-preview",
        params: {
          uri: encodeURIComponent(result.uri),
          width: String(result.width),
          height: String(result.height),
        },
      });
    } catch (error) {
      console.log("========== CROP ERROR ==========");

      console.log(error);
    } finally {
      setCropping(false);
    }
  };

  if (!imageUri) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No image found.</Text>

        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Crop Image</Text>

      <Text style={styles.instruction}>
        Drag inside the selected area to move it.
        {"\n"}
        Use any corner to resize.
      </Text>

      <View
        style={[
          styles.imageArea,
          {
            width: displayWidth,
            height: displayHeight,
          },
        ]}
      >
        <Image
          source={{ uri: imageUri }}
          style={{
            width: displayWidth,
            height: displayHeight,
          }}
          resizeMode="contain"
        />

        <View
          pointerEvents="none"
          style={[
            styles.cropBox,
            {
              left: cropX,
              top: cropY,
              width: cropWidth,
              height: cropHeight,
            },
          ]}
        >
          <View style={styles.verticalLineLeft} />

          <View style={styles.verticalLineRight} />

          <View style={styles.horizontalLineTop} />

          <View style={styles.horizontalLineBottom} />

          <View style={[styles.corner, styles.topLeft]} />

          <View style={[styles.corner, styles.topRight]} />

          <View style={[styles.corner, styles.bottomLeft]} />

          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View
          style={[
            styles.moveArea,
            {
              left: cropX,
              top: cropY,
              width: Math.max(cropWidth - HANDLE_SIZE / 2, 1),
              height: Math.max(cropHeight - HANDLE_SIZE / 2, 1),
            },
          ]}
          {...moveResponder.panHandlers}
        />

        <View
          style={[
            styles.resizeTouchArea,
            styles.topLeftTouch,
            {
              left: cropX - HANDLE_SIZE / 2,
              top: cropY - HANDLE_SIZE / 2,
            },
          ]}
          onTouchStart={() => startResize("topLeft")}
          {...resizeResponder.panHandlers}
        >
          <View style={[styles.resizeHandle, styles.topLeftHandle]} />
        </View>

        <View
          style={[
            styles.resizeTouchArea,
            styles.topRightTouch,
            {
              left: cropX + cropWidth - HANDLE_SIZE / 2,
              top: cropY - HANDLE_SIZE / 2,
            },
          ]}
          onTouchStart={() => startResize("topRight")}
          {...resizeResponder.panHandlers}
        >
          <View style={[styles.resizeHandle, styles.topRightHandle]} />
        </View>

        <View
          style={[
            styles.resizeTouchArea,
            styles.bottomLeftTouch,
            {
              left: cropX - HANDLE_SIZE / 2,
              top: cropY + cropHeight - HANDLE_SIZE / 2,
            },
          ]}
          onTouchStart={() => startResize("bottomLeft")}
          {...resizeResponder.panHandlers}
        >
          <View style={[styles.resizeHandle, styles.bottomLeftHandle]} />
        </View>

        <View
          style={[
            styles.resizeTouchArea,
            styles.bottomRightTouch,
            {
              left: cropX + cropWidth - HANDLE_SIZE / 2,
              top: cropY + cropHeight - HANDLE_SIZE / 2,
            },
          ]}
          onTouchStart={() => startResize("bottomRight")}
          {...resizeResponder.panHandlers}
        >
          <View style={[styles.resizeHandle, styles.bottomRightHandle]} />
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={cropping}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.cropButton]}
          onPress={handleCrop}
          disabled={cropping}
        >
          <Text style={styles.buttonText}>
            {cropping ? "Cropping..." : "Done"}
          </Text>
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
    paddingTop: 60,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  instruction: {
    color: "#aaa",
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 15,
  },

  imageArea: {
    alignSelf: "center",
    backgroundColor: "#111",
    overflow: "hidden",
  },

  cropBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff",
  },

  moveArea: {
    position: "absolute",
  },

  verticalLineLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "33.33%",
    width: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  verticalLineRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: "33.33%",
    width: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  horizontalLineTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "33.33%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  horizontalLineBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "33.33%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  corner: {
    position: "absolute",
    width: 25,
    height: 25,
    borderColor: "#fff",
  },

  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  resizeTouchArea: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },

  topLeftTouch: {},

  topRightTouch: {},

  bottomLeftTouch: {},

  bottomRightTouch: {},

  resizeHandle: {
    width: 28,
    height: 28,
    borderColor: "#fff",
  },

  topLeftHandle: {
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },

  topRightHandle: {
    borderTopWidth: 5,
    borderRightWidth: 5,
  },

  bottomLeftHandle: {
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },

  bottomRightHandle: {
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },

  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },

  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#444",
  },

  cropButton: {
    backgroundColor: "#007AFF",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  errorContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
});
