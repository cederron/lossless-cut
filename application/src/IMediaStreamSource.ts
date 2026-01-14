export interface IMediaStreamSource {
  readChunk(): Promise<Uint8Array | null>;
  abort(): void;
}