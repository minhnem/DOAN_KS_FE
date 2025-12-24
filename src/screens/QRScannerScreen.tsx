import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { checkInAttendanceApi } from "../api/client";

type Props = NativeStackScreenProps<any>;

const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locStatus === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    try {
      setScanned(true);

      // QR được sinh từ backend: { sessionId: "...", token: "..." }
      const parsed = JSON.parse(data);
      const sessionId = parsed.sessionId as string;
      const token = parsed.token as string;

      if (!sessionId || !token) {
        throw new Error("Mã QR không đúng định dạng.");
      }

      if (!hasLocationPermission) {
        throw new Error("Chưa cấp quyền vị trí.");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const accuracy = location.coords.accuracy ?? null;

      const res = await checkInAttendanceApi({
        sessionId,
        token,
        latitude,
        longitude,
        accuracy,
      });

      Alert.alert("Thông báo", res.data?.message ?? "Điểm danh thành công.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ?? error.message ?? "Điểm danh thất bại.",
        [{ text: "Quét lại", onPress: () => setScanned(false) }]
      );
    }
  };

  // Đang kiểm tra quyền
  if (!cameraPermission || hasLocationPermission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Đang xin quyền camera và vị trí...</Text>
      </View>
    );
  }

  // Chưa có quyền camera
  if (!cameraPermission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Ứng dụng cần quyền camera để quét mã QR.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Chưa có quyền vị trí
  if (!hasLocationPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Ứng dụng cần quyền vị trí để điểm danh.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.scanner}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Overlay với khung quét */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.scanHint}>Đưa mã QR vào khung để quét</Text>
          {scanned && (
            <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
              <Text style={styles.rescanButtonText}>Quét lại</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scanner: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#4361ee",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayMiddle: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#4361ee",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    paddingTop: 30,
  },
  scanHint: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  rescanButton: {
    marginTop: 20,
    backgroundColor: "#4361ee",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rescanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default QRScannerScreen;
