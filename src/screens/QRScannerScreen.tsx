import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { checkInAttendanceApi } from "../api/client";

type Props = NativeStackScreenProps<any>;

const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Dùng ref để tránh double navigation và double scan
  const hasNavigated = useRef(false);
  const isScanning = useRef(false);

  useEffect(() => {
    (async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locStatus === "granted");
    })();
    
    // Reset khi unmount
    return () => {
      hasNavigated.current = false;
      isScanning.current = false;
    };
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "✅ Có mặt";
      case "late":
        return "⏰ Muộn";
      case "absent_excused":
        return "📝 Vắng có phép";
      case "absent_unexcused":
        return "❌ Vắng không phép (ngoài vùng cho phép)";
      default:
        return status;
    }
  };

  const safeGoBack = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.goBack();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Chặn quét nhiều lần bằng cả state và ref
    if (scanned || processing || isScanning.current || hasNavigated.current) return;
    
    isScanning.current = true;
    setScanned(true);
    setProcessing(true);

    try {
      // QR được sinh từ backend: { sessionId: "...", token: "..." }
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        throw new Error("Mã QR không đúng định dạng JSON.");
      }
      
      const sessionId = parsed.sessionId as string;
      const token = parsed.token as string;

      if (!sessionId || !token) {
        throw new Error("Mã QR không chứa thông tin điểm danh.");
      }

      if (!hasLocationPermission) {
        throw new Error("Chưa cấp quyền vị trí. Vui lòng cấp quyền và thử lại.");
      }

      // Hiển thị đang lấy vị trí
      console.log("📍 Đang lấy vị trí GPS...");

      // Lấy vị trí GPS
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = locationResult.coords.latitude;
      const longitude = locationResult.coords.longitude;
      const accuracy = locationResult.coords.accuracy;
      
      console.log("📍 Vị trí điểm danh:", { latitude, longitude, accuracy });

      // Kiểm tra vị trí hợp lệ (không phải 0,0)
      if (latitude === 0 && longitude === 0) {
        throw new Error("Không thể lấy vị trí GPS. Vui lòng bật GPS và thử lại.");
      }

      if (!latitude || !longitude) {
        throw new Error("Vị trí GPS không hợp lệ. Vui lòng thử lại.");
      }

      const res = await checkInAttendanceApi({
        sessionId,
        token,
        latitude,
        longitude,
        accuracy,
      });

      const attendanceData = res.data?.data;
      const status = attendanceData?.status || "present";
      const distance = attendanceData?.location?.distanceToClass;

      // Tạo message chi tiết
      let message = `Trạng thái: ${getStatusText(status)}`;
      if (distance !== undefined && distance !== null) {
        message += `\nKhoảng cách đến lớp: ${Math.round(distance)}m`;
      }
      message += `\n\nVị trí của bạn:\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      // Hiển thị thông báo thành công và quay lại
      Alert.alert("🎉 Điểm danh thành công!", message, [
        { text: "OK", onPress: safeGoBack },
      ]);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message ?? error.message ?? "Điểm danh thất bại.";
      Alert.alert("❌ Lỗi điểm danh", errorMessage, [
        { text: "Quay lại", onPress: safeGoBack },
      ]);
    } finally {
      setProcessing(false);
      isScanning.current = false;
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
        onBarcodeScanned={(scanned || processing) ? undefined : handleBarCodeScanned}
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
          {processing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4361ee" />
              <Text style={styles.processingText}>Đang xử lý điểm danh...</Text>
            </View>
          ) : (
            <Text style={styles.scanHint}>Đưa mã QR vào khung để quét</Text>
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
  processingContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
  },
  processingText: {
    color: "#4361ee",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
});

export default QRScannerScreen;
