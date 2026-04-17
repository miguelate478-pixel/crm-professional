import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/routers";
import { getAuthToken } from "./auth";
import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

export const trpc = createTRPCReact<AppRouter>();

export const createTRPCClient_ = () => {
  return createTRPCClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        async headers() {
          const token = await getAuthToken();
          return {
            authorization: token ? `Bearer ${token}` : "",
          };
        },
        fetch: async (url, options) => {
          const response = await fetch(url, {
            ...options,
            credentials: "include",
          });
          return response;
        },
      }),
    ],
  });
};

export const trpcClient = createTRPCClient_();
