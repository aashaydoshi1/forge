import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/** iOS Keychain historically rejected values above ~2048 bytes. */
const CHUNK_SIZE = 2048;

let secureStoreAvailable: boolean | null = null;

async function isSecureStoreAvailable(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    // false on web (native stub is empty) and when the native module is missing
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }

  return secureStoreAvailable;
}

async function setItem(key: string, value: string): Promise<void> {
  if (!(await isSecureStoreAvailable())) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));

  for (let i = 0; i < chunkCount; i++) {
    await SecureStore.setItemAsync(
      `${key}_${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    );
  }
}

async function getItem(key: string): Promise<string | null> {
  if (!(await isSecureStoreAvailable())) {
    return AsyncStorage.getItem(key);
  }

  const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);

  if (!chunkCountStr) {
    return SecureStore.getItemAsync(key);
  }

  const chunkCount = parseInt(chunkCountStr, 10);
  const chunks: string[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
    if (chunk === null) return null;
    chunks.push(chunk);
  }

  return chunks.join('');
}

async function removeItem(key: string): Promise<void> {
  if (!(await isSecureStoreAvailable())) {
    await AsyncStorage.removeItem(key);
    return;
  }

  const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);

  if (!chunkCountStr) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  const chunkCount = parseInt(chunkCountStr, 10);
  await SecureStore.deleteItemAsync(`${key}_chunks`);

  for (let i = 0; i < chunkCount; i++) {
    await SecureStore.deleteItemAsync(`${key}_${i}`);
  }
}

/** Supabase auth storage — SecureStore on native, AsyncStorage when unavailable. */
export const secureStoreAdapter = {
  getItem,
  setItem,
  removeItem,
};
