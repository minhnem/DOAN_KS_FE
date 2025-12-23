import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getAttendanceHistory } from "../api/client";

// Dùng kiểu generic rộng để không phụ thuộc vào stack hiện tại
type Props = NativeStackScreenProps<any>;

interface AttendanceItem {
  _id: string;
  sessionTitle?: string;
  checkInTime: string;
  status: "present" | "late" | "outside_area";
}

const AttendanceHistoryScreen: React.FC<Props> = () => {
  const [items, setItems] = useState<AttendanceItem[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await getAttendanceHistory();
      setItems(res.data?.data ?? []);
    } catch (error) {
      // Có thể thêm Alert báo lỗi
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: AttendanceItem }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.sessionTitle ?? "Buổi học"}</Text>
      <Text>{new Date(item.checkInTime).toLocaleString()}</Text>
      <Text>Trạng thái: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Chưa có bản ghi điểm danh.</Text>}
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
  title: { fontWeight: "bold" },
});

export default AttendanceHistoryScreen;


