/** Subscribe to `window.dispatchEvent(new CustomEvent(name, { detail }))` with typed detail. */
export function addWindowCustomListener<T>(eventName: string, handler: (detail: T) => void): () => void {
  const listener = (e: Event) => {
    handler((e as CustomEvent<T>).detail);
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
