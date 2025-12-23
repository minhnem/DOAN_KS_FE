import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { generateQrForSession } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherQR">;

const TeacherQrScreen: React.FC<Props> = ({ route }) => {
  const { sessionId } = route.params;
  const [qrPayload, setQrPayload] = useState<{ sessionId: string; token: string } | null>(
    null
  );
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQr = async () => {
    try {
      setLoading(true);
      const res = await generateQrForSession(sessionId, 5);
      const data = res.data?.data;
      setQrPayload(data?.qrPayload ?? null);
      setExpiresAt(data?.expiresAt ?? null);
    } catch (error: any) {
      Alert.alert("Lỗi tạo QR", error.response?.data?.message ?? error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQr();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Đang sinh QR...</Text>
      </View>
    );
  }

  if (!qrPayload) {
    return (
      <View style={styles.center}>
        <Text>Không có QR để hiển thị.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR điểm danh</Text>
      <QRCode value={JSON.stringify(qrPayload)} size={220} />
      {expiresAt && (
        <Text style={{ marginTop: 12 }}>
          Hết hạn: {new Date(expiresAt).toLocaleTimeString()}
        </Text>
      )}
      <Text style={{ marginTop: 8, color: "#666" }}>
        Mã sẽ hết hạn sau vài phút, có thể bấm quay lại / mở lại để sinh mã mới.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
});

export default TeacherQrScreen;


