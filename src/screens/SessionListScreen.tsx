import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getSessionsByClass } from "../api/client";

// Dùng generic rộng để không phụ thuộc vào stack hiện tại
type Props = NativeStackScreenProps<any>;

interface SessionItem {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "ongoing" | "closed";
}

const SessionListScreen: React.FC<Props> = ({ route, navigation }) => {
  const classId = route?.params?.classId as string | undefined;

  if (!classId) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy thông tin lớp.</Text>
      </View>
    );
  }
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  const fetchSessions = async () => {
    try {
      const res = await getSessionsByClass(classId);
      setSessions(res.data?.data ?? []);
    } catch (error) {
      // Có thể Alert ở đây
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const renderItem = ({ item }: { item: SessionItem }) => (
    <TouchableOpacity
      style={styles.item}
      disabled={item.status !== "ongoing"}
      onPress={() =>
        navigation.navigate("QRScanner", {
          sessionId: item._id,
        })
      }
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text>
        {new Date(item.startTime).toLocaleString()} -{" "}
        {new Date(item.endTime).toLocaleTimeString()}
      </Text>
      <Text>Trạng thái: {item.status}</Text>
      {item.status === "ongoing" && <Text style={styles.open}>ĐANG MỞ ĐIỂM DANH</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Chưa có buổi học nào.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
  },
  title: { fontWeight: "bold", fontSize: 16 },
  open: { color: "green", fontWeight: "bold", marginTop: 4 },
});

export default SessionListScreen;


