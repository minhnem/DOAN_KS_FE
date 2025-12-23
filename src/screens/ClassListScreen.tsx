import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getStudentClasses } from "../api/client";

// Dùng kiểu generic rộng để tránh lệ thuộc vào stack giảng viên
type Props = NativeStackScreenProps<any>;

interface ClassItem {
  _id: string;
  code: string;
  name: string;
  teacherName?: string;
}

const ClassListScreen: React.FC<Props> = ({ navigation }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await getStudentClasses();
      setClasses(res.data?.data ?? []);
    } catch (error) {
      // Bạn có thể thêm Alert để báo lỗi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const renderItem = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("Sessions", { classId: item._id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.code}>{item.code}</Text>
      {item.teacherName && <Text>GV: {item.teacherName}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Đang tải lớp học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Chưa có lớp học nào.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ddd",
  },
  name: { fontWeight: "bold", fontSize: 16 },
  code: { color: "#555" },
});

export default ClassListScreen;


