export const ACCESS_CODE = "alianca753";
export const ACCESS_KEY = "ao_access_ok";

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ACCESS_KEY) === "1";
}

export function unlock(code: string): boolean {
  if (code.trim() === ACCESS_CODE) {
    window.localStorage.setItem(ACCESS_KEY, "1");
    return true;
  }
  return false;
}

export function lock() {
  window.localStorage.removeItem(ACCESS_KEY);
}
