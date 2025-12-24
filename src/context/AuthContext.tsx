import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = 1 | 2 | null; // 1 = Student, 2 = Teacher

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole;
  isLoading: boolean;
  login: (token: string, role: number) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token khi khởi động app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const roleStr = await AsyncStorage.getItem("userRole");
        const role = roleStr ? (parseInt(roleStr, 10) as UserRole) : null;

        setIsLoggedIn(!!token);
        setUserRole(role);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (token: string, role: number) => {
    await AsyncStorage.setItem("accessToken", token);
    await AsyncStorage.setItem("userRole", String(role));
    setUserRole(role as UserRole);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, isLoading, login, logout }}>
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

