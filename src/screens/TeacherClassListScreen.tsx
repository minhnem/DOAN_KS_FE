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
import { RootStackParamList } from "../navigation/AppNavigator";
import { getTeacherClasses } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherClasses">;

interface ClassItem {
  _id: string;
  code: string;
  name: string;
  studentCount?: number;
}

const TeacherClassListScreen: React.FC<Props> = ({ navigation }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await getTeacherClasses();
      setClasses(res.data?.data ?? []);
    } catch (error) {
      // TODO: show alert
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
      onPress={() => navigation.navigate("TeacherSessions", { classId: item._id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.code}>{item.code}</Text>
      {item.studentCount !== undefined && <Text>Số SV: {item.studentCount}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Đang tải lớp...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>Chưa có lớp nào.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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

export default TeacherClassListScreen;


