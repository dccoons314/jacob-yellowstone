import { STALE_DEGRADED_HOURS } from '../config.js';

function getStorage() {
  const storage = globalThis.localStorage ?? null;
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    return null;
  }

  return storage;
}

export function getStaleMode(lastSuccessAt, now = new Date()) {
  const lastSuccessTime = lastSuccessAt instanceof Date ? lastSuccessAt.getTime() : new Date(lastSuccessAt).getTime();
  const ageHours = (now.getTime() - lastSuccessTime) / (60 * 60 * 1000);

  return ageHours >= STALE_DEGRADED_HOURS ? 'degraded' : 'warning';
}

export function shouldShowDegradedBanner(lastSuccessAt, now = new Date()) {
  if (!lastSuccessAt) {
    return false;
  }

  return getStaleMode(lastSuccessAt, now) === 'degraded';
}

export function cacheWeather(key, payload, now = new Date()) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify({ payload, cachedAt: now.toISOString() }));
}

export function readCachedWeather(key) {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const value = storage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
