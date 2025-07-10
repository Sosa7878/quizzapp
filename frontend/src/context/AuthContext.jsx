import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAdmin = localStorage.getItem("isAdmin") === "true";
    if (storedToken) {
      setToken(storedToken);
      setIsAdmin(storedAdmin);
    }
    setLoading(false);
  }, []);

  const login = (token, isAdminFlag) => {
    const isAdminValue = isAdminFlag === true || isAdminFlag === 1 || isAdminFlag === "1";
    setToken(token);
    setIsAdmin(isAdminValue);
    localStorage.setItem("token", token);
    localStorage.setItem("isAdmin", isAdminValue);
    navigate("/");
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}