import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 2048;

async function setItem(key: string, value: string): Promise<void> {
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

export const secureStoreAdapter = {
  getItem,
  setItem,
  removeItem,
};
