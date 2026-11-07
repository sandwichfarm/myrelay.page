declare const version: { value: string };
interface Window {
  nostr?: {
    getPublicKey(): Promise<string>;
    signEvent(template: import('nostr-tools').EventTemplate): Promise<import('nostr-tools').NostrEvent>;
  };
  nostrZap?: { initTarget(element: Element | null): void };
}
