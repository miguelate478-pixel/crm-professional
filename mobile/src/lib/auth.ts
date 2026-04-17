import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jose";
import type { AuthToken, User } from "@types/index";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

export async function saveAuthToken(token: AuthToken): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token.accessToken);
    if (token.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token.refreshToken);
    }
  } catch (error) {
    console.error("Failed to save auth token:", error);
    throw error;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear auth tokens:", error);
    throw error;
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save user:", error);
    throw error;
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

export async function clearUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error("Failed to clear user:", error);
    throw error;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return true;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) return false;
    return !isTokenExpired(token);
  } catch (error) {
    console.error("Failed to check authentication:", error);
    return false;
  }
}
