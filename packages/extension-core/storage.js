/**
 * Chrome storage helpers for New Tab extensions.
 * Copy or import into extension packages as needed.
 */

export function createStorage(defaults, area = "local") {
  const api = globalThis.chrome?.storage?.[area];

  async function getAll() {
    if (!api) return { ...defaults };
    return new Promise((resolve) => {
      api.get(defaults, (result) => resolve({ ...defaults, ...result }));
    });
  }

  async function get(key) {
    const all = await getAll();
    return all[key];
  }

  async function set( partial) {
    if (!api) return;
    return new Promise((resolve) => {
      api.set(partial, () => resolve());
    });
  }

  async function reset() {
    if (!api) return;
    return new Promise((resolve) => {
      api.clear(() => {
        api.set(defaults, () => resolve());
      });
    });
  }

  return { getAll, get, set, reset, defaults };
}
