import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { checkInAttendanceApi } from "../api/client";

// Dùng generic rộng để tránh phụ thuộc vào stack hiện tại
type Props = NativeStackScreenProps<any>;

const QRScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(
    null
  );
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status: camStatus } = await BarCodeScanner.requestPermissionsAsync();
      setHasCameraPermission(camStatus === "granted");

      const { status: locStatus } =
        await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locStatus === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
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

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Đang xin quyền camera và vị trí...</Text>
      </View>
    );
  }

  if (!hasCameraPermission || !hasLocationPermission) {
    return (
      <View style={styles.center}>
        <Text>Ứng dụng cần quyền camera và vị trí để điểm danh.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
      />
      {scanned && <Button title="Quét lại" onPress={() => setScanned(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scanner: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default QRScannerScreen;


