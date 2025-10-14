export type DraftSlugStyle = "compact" | "kebab";

/**
 * Turn a draft name into a filesystem-safe filename for per-draft main files.
 * - 'compact': remove whitespace and lowercase (default) -> "Draft 1" => "draft1"
 * - 'kebab': replace whitespace with dashes and lowercase -> "Draft 1" => "draft-1"
 */
export function slugifyDraftName(draftName: string, style: DraftSlugStyle = "compact"): string {
  if (!draftName) return "";
  const trimmed = draftName.trim();
  if (style === "kebab") {
    return trimmed.replace(/\s+/g, "-").toLowerCase();
  }
  // compact
  return trimmed.replace(/\s+/g, "").toLowerCase();
}

export const DEFAULT_MULTI_TARGET_WORD_COUNT = 50000;
export const DEFAULT_SINGLE_TARGET_WORD_COUNT = 20000;

/**
 * Async-aware filter: runs the async predicate across the array and returns items
 * for which the predicate resolved to true.
 */
export async function asyncFilter<T>(
  arr: T[],
  predicate: (item: T) => Promise<boolean> | boolean,
): Promise<T[]> {
  const results = await Promise.all(arr.map((it) => Promise.resolve(predicate(it))));
  return arr.filter((_, i) => results[i]);
}
