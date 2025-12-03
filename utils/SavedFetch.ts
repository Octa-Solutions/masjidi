export class SavedFetch {
  static async fetch(
    key: string,
    {
      input,
      init,
      state = null,
    }: { input: RequestInfo | URL; init?: RequestInit; state?: any }
  ) {
    const dataKey = `@saved-fetch/data/${key}`;
    const stateKey = `@saved-fetch/state/${key}`;

    const stateString = JSON.stringify(state);
    const isStateChanged = localStorage.getItem(stateKey) !== stateString;

    const savedData = localStorage.getItem(dataKey);

    if (!isStateChanged && savedData) {
      return savedData;
    }

    try {
      const data = await fetch(input, init).then((e) => e.text());
      localStorage.setItem(dataKey, data);
      localStorage.setItem(stateKey, stateString);

      return data;
    } catch (e) {
      if (savedData === null) throw e;

      console.warn(`Fetch failed for ${key}, using cached data.`, e);

      return savedData;
    }
  }
}
