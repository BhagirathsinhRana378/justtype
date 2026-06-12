export type SoundType = "natural" | "signature" | "typeist" | "silent";

export function playKeySound(...args: unknown[]) {
  // Permanently disabled
  if (args.length > 0) return;
}
