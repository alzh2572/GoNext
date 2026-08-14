import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR_NAME = 'photos';
const WEB_PHOTOS_PLACEHOLDER = 'web://photos/';

function isFileSystemAvailable(): boolean {
  return Platform.OS !== 'web' && Boolean(FileSystem.documentDirectory);
}

function getPhotosRootUri(): string {
  if (!isFileSystemAvailable() || !FileSystem.documentDirectory) {
    return WEB_PHOTOS_PLACEHOLDER;
  }
  return `${FileSystem.documentDirectory}${PHOTOS_DIR_NAME}/`;
}

/** Создаёт каталог для локальных фотографий приложения. */
export async function ensurePhotosDirectory(): Promise<string> {
  const root = getPhotosRootUri();

  // На web нет documentDirectory — фото храним только на устройстве.
  if (!isFileSystemAvailable()) {
    return root;
  }

  const info = await FileSystem.getInfoAsync(root);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(root, { intermediates: true });
  }
  return root;
}

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

/**
 * Копирует файл фото в локальное хранилище приложения.
 * В БД сохраняется только путь (URI), не бинарные данные.
 */
export async function savePhotoFile(
  sourceUri: string,
  folder: string,
): Promise<string> {
  if (!isFileSystemAvailable()) {
    throw new Error('Сохранение фото доступно только на мобильном устройстве');
  }

  const root = await ensurePhotosDirectory();
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_') || 'misc';
  const dir = `${root}${safeFolder}/`;

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionFromUri(sourceUri)}`;
  const destination = `${dir}${fileName}`;

  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
  if (!sourceInfo.exists) {
    throw new Error('Исходный файл фото не найден');
  }

  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function deletePhotoFile(uri: string): Promise<void> {
  if (!isFileSystemAvailable() || uri.startsWith('web://')) {
    return;
  }

  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export async function deletePhotoFiles(uris: string[]): Promise<void> {
  await Promise.all(uris.map((uri) => deletePhotoFile(uri)));
}

export function getPhotosDirectoryUri(): string {
  return getPhotosRootUri();
}

export function canStorePhotosLocally(): boolean {
  return isFileSystemAvailable();
}

export async function clearPhotosDirectory(): Promise<void> {
  if (!isFileSystemAvailable()) {
    return;
  }

  const root = getPhotosRootUri();
  const info = await FileSystem.getInfoAsync(root);
  if (info.exists) {
    await FileSystem.deleteAsync(root, { idempotent: true });
  }
  await ensurePhotosDirectory();
}
