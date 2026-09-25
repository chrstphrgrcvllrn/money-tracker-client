// Browser storage for per-user data is namespaced by user id, so two people
// using the same browser never read each other's values.
//
// One-time adoption: values saved before accounts existed live under the bare
// key. The first account to open the app on this browser takes them over (and
// the bare key is removed). That's the owner's own data on their own browser.

const scoped = (baseKey: string, userId: string) => `${baseKey}:${userId}`;

export const readUserItem = (baseKey: string, userId: string): string | null => {
  try {
    const own = localStorage.getItem(scoped(baseKey, userId));
    if (own !== null) return own;

    const legacy = localStorage.getItem(baseKey);
    if (legacy !== null) {
      localStorage.setItem(scoped(baseKey, userId), legacy);
      localStorage.removeItem(baseKey);
      return legacy;
    }
  } catch {
    // storage unavailable (private mode, etc.)
  }
  return null;
};

export const writeUserItem = (baseKey: string, userId: string, value: string) => {
  try {
    localStorage.setItem(scoped(baseKey, userId), value);
  } catch {
    // ignore: the value just won't persist
  }
};
