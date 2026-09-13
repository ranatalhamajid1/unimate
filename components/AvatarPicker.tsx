import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { AppText } from "@/components/ui/AppText";
import { AvatarFallback } from "@/components/ui/AvatarFallback";
import { apiUpload, apiDelete } from "@/lib/api-client";
import { triggerSuccessFeedback, triggerDestructiveFeedback } from "@/lib/haptics";
import { spacing } from "@/constants/spacing";

interface AvatarPickerProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  onAvatarChange?: (newUrl: string | null) => void;
  editable?: boolean;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export function getSafeMimeType(uri: string, mimeType?: string | null): string {
  if (mimeType) {
    const lower = mimeType.toLowerCase();
    if (lower === "image/png") return "image/png";
    if (lower === "image/webp") return "image/webp";
    if (lower === "image/jpeg" || lower === "image/jpg") return "image/jpeg";
  }
  const cleanUri = uri.toLowerCase().split("?")[0];
  if (cleanUri.endsWith(".png")) return "image/png";
  if (cleanUri.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function getSafeFilename(uri: string, fileName?: string | null, mimeType?: string): string {
  if (fileName && fileName.trim().length > 0) {
    return fileName.trim();
  }
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `avatar-${Date.now()}.${ext}`;
}

export function AvatarPicker({
  avatarUrl,
  name,
  size = 84,
  onAvatarChange,
  editable = true,
}: AvatarPickerProps) {
  const { colors } = useTheme();
  const [currentUrl, setCurrentUrl] = useState<string | null>(avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    setCurrentUrl(avatarUrl || null);
  }, [avatarUrl]);

  const handleUploadUri = async (uri: string, mimeType?: string | null, fileName?: string | null) => {
    if (isUploading || isDeleting) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const detectedType = getSafeMimeType(uri, mimeType);
      const detectedName = getSafeFilename(uri, fileName, detectedType);
      const cleanUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;

      const formData = new FormData();
      formData.append("file", {
        uri: cleanUri,
        name: detectedName,
        type: detectedType,
      } as any);

      const res = await apiUpload<{ success: boolean; avatarUrl: string; error?: string }>(
        "/api/mobile/user/avatar/upload",
        formData
      );

      if (res && res.success && res.avatarUrl) {
        triggerSuccessFeedback();
        setCurrentUrl(res.avatarUrl);
        if (onAvatarChange) {
          onAvatarChange(res.avatarUrl);
        }
      } else {
        setErrorMessage(res?.error || "Failed to upload avatar.");
      }
    } catch (err: any) {
      const rawMessage = err?.message || "";
      if (rawMessage.includes("FormDataPart")) {
        setErrorMessage("Upload failed due to an unsupported format. Please try another image.");
      } else {
        setErrorMessage(rawMessage || "Failed to upload avatar. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleChoosePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
          setErrorMessage("Avatar image must be under 2 MB.");
          return;
        }
        await handleUploadUri(asset.uri, asset.mimeType, asset.fileName || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to select photo.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to take a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
          setErrorMessage("Avatar image must be under 2 MB.");
          return;
        }
        await handleUploadUri(asset.uri, asset.mimeType, asset.fileName || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to take photo.");
    }
  };

  const handleRemovePhoto = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await apiDelete<{ success: boolean; error?: string }>(
        "/api/mobile/user/avatar"
      );

      if (res && res.success) {
        triggerDestructiveFeedback();
        setCurrentUrl(null);
        if (onAvatarChange) {
          onAvatarChange(null);
        }
      } else {
        setErrorMessage(res?.error || "Failed to remove avatar.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to remove avatar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const showOptionsAlert = () => {
    if (!editable || isUploading || isDeleting) return;

    const options: { text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }[] = [
      { text: "Choose from Library", onPress: handleChoosePhoto },
      { text: "Take Photo", onPress: handleTakePhoto },
    ];

    if (currentUrl) {
      options.push({
        text: "Remove Photo",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Remove Photo",
            "Are you sure you want to remove your profile picture?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: handleRemovePhoto },
            ]
          );
        },
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Profile Photo", "Choose an option to update your photo", options);
  };

  const borderRadius = Math.round(size / 2);
  const isLoading = isUploading || isDeleting;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={showOptionsAlert}
        disabled={!editable || isLoading}
        activeOpacity={0.8}
        style={[
          styles.avatarTouch,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        {currentUrl ? (
          <Image
            source={{ uri: currentUrl }}
            style={[styles.image, { width: size, height: size, borderRadius }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <AvatarFallback name={name} size={size} />
        )}

        {/* Loading Overlay */}
        {isLoading ? (
          <View
            style={[
              styles.loadingOverlay,
              { width: size, height: size, borderRadius, backgroundColor: "rgba(0,0,0,0.4)" },
            ]}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : editable ? (
          /* Edit Badge */
          <View
            style={[
              styles.editBadge,
              {
                backgroundColor: colors.accent,
                borderColor: colors.surface,
              },
            ]}
          >
            <Ionicons name="camera" size={12} color="#FFFFFF" />
          </View>
        ) : null}
      </TouchableOpacity>

      {errorMessage ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <AppText variant="caption" style={{ color: colors.danger, marginLeft: 4, fontSize: 11 }}>
            {errorMessage}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  avatarTouch: {
    borderWidth: 2,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    overflow: "hidden",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
