import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { joinClassByCodeApi } from "../api/client";

type Props = NativeStackScreenProps<any>;

type JoinMode = "code" | "qr";

interface JoinedClass {
  _id: string;
  code: string;
  name: string;
  teacherName?: string;
}

const JoinClassScreen: React.FC<Props> = ({ navigation }) => {
  const [mode, setMode] = useState<JoinMode>("code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [joinedClass, setJoinedClass] = useState<JoinedClass | null>(null);

  const handleJoinClass = async (classCode: string) => {
    if (!classCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã lớp học.");
      return;
    }

    try {
      setLoading(true);
      const res = await joinClassByCodeApi(classCode.trim());
      const classData = res.data?.data;
      setJoinedClass(classData);
      Alert.alert("Thành công", `Bạn đã tham gia lớp "${classData.name}"!`);
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message ?? error.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    try {
      setScanned(true);
      const parsed = JSON.parse(data);

      if (parsed.type !== "join_class" || !parsed.code) {
        throw new Error("Mã QR không hợp lệ cho việc tham gia lớp.");
      }

      await handleJoinClass(parsed.code);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        // Nếu không phải JSON, thử dùng trực tiếp như là mã lớp
        await handleJoinClass(data);
      } else {
        Alert.alert("Lỗi", error.message);
        setScanned(false);
      }
    }
  };

  // Màn hình sau khi tham gia thành công
  if (joinedClass) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Tham gia thành công!</Text>

          <View style={styles.classInfo}>
            <Text style={styles.className}>{joinedClass.name}</Text>
            {joinedClass.teacherName && (
              <Text style={styles.teacherName}>GV: {joinedClass.teacherName}</Text>
            )}
            <Text style={styles.classCode}>Mã lớp: {joinedClass.code}</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Hoàn tất</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderQRScanner = () => {
    if (!cameraPermission) {
      return <Text style={styles.permissionText}>Đang xin quyền camera...</Text>;
    }

    if (!cameraPermission.granted) {
      return (
        <View style={styles.permissionDenied}>
          <Text style={styles.permissionText}>
            Ứng dụng cần quyền camera để quét mã QR
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestCameraPermission}>
            <Text style={styles.grantButtonText}>Cấp quyền Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Quét lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Tham gia lớp học</Text>
        <Text style={styles.subtitle}>
          Nhập mã lớp hoặc quét mã QR từ giảng viên
        </Text>

        {/* Tab chuyển đổi mode */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === "code" && styles.activeTab]}
            onPress={() => setMode("code")}
          >
            <Text style={[styles.tabText, mode === "code" && styles.activeTabText]}>
              Nhập mã
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "qr" && styles.activeTab]}
            onPress={() => setMode("qr")}
          >
            <Text style={[styles.tabText, mode === "qr" && styles.activeTabText]}>
              Quét QR
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "code" ? (
          <View style={styles.codeSection}>
            <Text style={styles.label}>Mã lớp học</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="VD: ABC123"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.joinButton, loading && styles.disabledButton]}
              onPress={() => handleJoinClass(code)}
              disabled={loading}
            >
              <Text style={styles.joinButtonText}>
                {loading ? "Đang tham gia..." : "Tham gia lớp"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.qrSection}>
            {renderQRScanner()}
            <Text style={styles.qrHint}>
              Đưa camera vào mã QR của giảng viên
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f7fa",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#4361ee",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  codeSection: {
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  codeInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 4,
    backgroundColor: "#fafafa",
  },
  joinButton: {
    width: "100%",
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  qrSection: {
    alignItems: "center",
  },
  scannerContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 200,
    height: 200,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#4361ee",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  rescanButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#4361ee",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  permissionText: {
    textAlign: "center",
    color: "#666",
    padding: 20,
  },
  permissionDenied: {
    padding: 40,
    alignItems: "center",
  },
  grantButton: {
    marginTop: 16,
    backgroundColor: "#4361ee",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  grantButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  qrHint: {
    fontSize: 13,
    color: "#888",
    marginTop: 16,
    textAlign: "center",
  },

  // Success screen
  successContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f7fa",
    justifyContent: "center",
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2ecc71",
    marginBottom: 20,
  },
  classInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  className: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
  },
  teacherName: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  classCode: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  doneButton: {
    width: "100%",
    backgroundColor: "#4361ee",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default JoinClassScreen;
