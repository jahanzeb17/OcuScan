import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "ocuscan_access_token";

export async function saveAccessToken(
  token: string
): Promise<void> {
  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token
  );
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}