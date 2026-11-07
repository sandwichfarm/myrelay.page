declare module 'jsonpack' {
  const jsonpack: { pack(value: unknown): string; unpack(value: string): any };
  export default jsonpack;
}
declare module 'object-hash' {
  export default function objectHash(value: unknown, options?: { algorithm?: string }): string;
}
declare module 'dompurify' {
  const DOMPurify: { sanitize(value: string): string };
  export default DOMPurify;
}
declare module 'nostr-zap';
