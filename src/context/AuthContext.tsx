import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = 1 | 2 | null; // 1 = Student, 2 = Teacher

interface UserData {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
  rule: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole;
  user: UserData | null;
  isLoading: boolean;
  login: (token: string, role: number, userData: UserData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token khi khởi động app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const roleStr = await AsyncStorage.getItem("userRole");
        const userDataStr = await AsyncStorage.getItem("userData");
        const role = roleStr ? (parseInt(roleStr, 10) as UserRole) : null;
        const userData = userDataStr ? JSON.parse(userDataStr) : null;

        setIsLoggedIn(!!token);
        setUserRole(role);
        setUser(userData);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (token: string, role: number, userData: UserData) => {
    await AsyncStorage.setItem("accessToken", token);
    await AsyncStorage.setItem("userRole", String(role));
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    setUserRole(role as UserRole);
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("userRole");
    await AsyncStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserRole(null);
    setUser(null);
  };

  const updateUser = async (updatedData: Partial<UserData>) => {
    if (user) {
      const newUserData = { ...user, ...updatedData };
      await AsyncStorage.setItem("userData", JSON.stringify(newUserData));
      setUser(newUserData);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

