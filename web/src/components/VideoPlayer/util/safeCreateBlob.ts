export function safeCreateBlob(array: Uint8Array, options?: BlobPropertyBag) {
  // if we don't do this when creating a Blob, we get:
  // "Failed to construct 'Blob': The provided ArrayBufferView value must not be resizable."
  // maybe when moving away from @electron/remote, it's not needed anymore?
  // https://stackoverflow.com/a/25255750/6519037
  const cloned = new Uint8Array(array);
  return new Blob([cloned], options);
}