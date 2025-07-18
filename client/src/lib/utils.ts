import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getVideoId(url: string): string | null {
  const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return !!getVideoId(url);
}

export const storageAvailable = (type: string): boolean => {
  try {
    const storage = window[type as keyof Window] as Storage;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

export function saveToLocalStorage(key: string, value: any): void {
  if (storageAvailable('localStorage')) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (!storageAvailable('localStorage')) {
    return defaultValue;
  }
  
  const stored = localStorage.getItem(key);
  if (!stored) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error('Error parsing localStorage item:', error);
    return defaultValue;
  }
}
