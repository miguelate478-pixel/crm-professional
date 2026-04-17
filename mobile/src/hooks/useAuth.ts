import { useCallback } from "react";
import { useAuthStore } from "@store/auth";
import { saveAuthToken, saveUser } from "@lib/auth";
import type { User, AuthToken } from "@types/index";

export function useAuth() {
  const { user, token, isLoading, error, setUser, setToken, logout } =
    useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      // This will be implemented with actual API call in the login screen
      // For now, this is a placeholder
    },
    []
  );

  const handleLoginSuccess = useCallback(
    async (user: User, authToken: AuthToken) => {
      await saveAuthToken(authToken);
      await saveUser(user);
      setUser(user);
      setToken(authToken.accessToken);
    },
    [setUser, setToken]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    user,
    token,
    isLoading,
    error,
    login,
    logout: handleLogout,
    handleLoginSuccess,
    isAuthenticated: !!token && !!user,
  };
}
