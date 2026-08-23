// In-memory stand-in for react-native-mmkv's native module, which doesn't
// exist under Jest's Node environment. Zustand stores instantiate `new MMKV(...)`
// at module load time, so this needs to work with zero native bindings.
export class MMKV {
  private store = new Map<string, string | number | boolean>();

  getString(key: string): string | undefined {
    const value = this.store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.store.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  set(key: string, value: string | number | boolean): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  contains(key: string): boolean {
    return this.store.has(key);
  }

  clearAll(): void {
    this.store.clear();
  }
}
