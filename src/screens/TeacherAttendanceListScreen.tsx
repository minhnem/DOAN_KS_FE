import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getAttendanceBySession } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherAttendance">;

interface AttendanceItem {
  _id: string;
  studentName?: string;
  studentCode?: string;
  status: "present" | "late" | "outside_area";
  checkInTime: string;
  location?: {
    distanceToClass?: number;
  };
}

const TeacherAttendanceListScreen: React.FC<Props> = ({ route }) => {
  const { sessionId } = route.params;
  const [items, setItems] = useState<AttendanceItem[]>([]);

  const fetchAttendance = async () => {
    try {
      const res = await getAttendanceBySession(sessionId);
      setItems(res.data?.data ?? []);
    } catch (error) {
      // TODO: alert
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const renderItem = ({ item }: { item: AttendanceItem }) => (
    <View style={styles.item}>
      <Text style={styles.name}>
        {item.studentName ?? "Sinh viên"} {item.studentCode ? `(${item.studentCode})` : ""}
      </Text>
      <Text>Trạng thái: {item.status}</Text>
      <Text>Giờ vào: {new Date(item.checkInTime).toLocaleString()}</Text>
      {item.location?.distanceToClass !== undefined && (
        <Text>Cách lớp: {item.location.distanceToClass.toFixed(1)} m</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Chưa có sinh viên điểm danh.</Text>}
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
  name: { fontWeight: "bold" },
});

export default TeacherAttendanceListScreen;


