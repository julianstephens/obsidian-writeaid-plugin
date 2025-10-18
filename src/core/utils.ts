import type { CallableFunction, ExceptionConstructor } from "@/types";
import { WriteAidError } from "@/types";
import { Notice } from "obsidian";

export const FOLDERS = {
  DRAFTS: "drafts",
  MANUSCRIPTS: "manuscripts",
  BACKUPS: ".writeaid-backups",
} as const;

export const FILES = {
  META: "meta.md",
  OUTLINE: "outline.md",
} as const;

export const SLUG_STYLE = {
  COMPACT: "compact",
  KEBAB: "kebab",
} as const;
export type DraftSlugStyle = (typeof SLUG_STYLE)[keyof typeof SLUG_STYLE];

export const PROJECT_TYPE = {
  SINGLE: "single-file",
  MULTI: "multi-file",
} as const;
export type ProjectType = (typeof PROJECT_TYPE)[keyof typeof PROJECT_TYPE];
export const VALID_PROJECT_TYPES = Object.values(PROJECT_TYPE);

export const APP_NAME = "WriteAid";
export const DEBUG_PREFIX = `${APP_NAME} debug:`;
export const WRITE_AID_ICON_NAME = "pen-tool";
export const WRITEAID_VERSION = "1.0.0";

export const MARKDOWN_FILE_EXTENSION = ".md";

export const PANEL_DEBOUNCE_MIN = 0;
export const PANEL_DEBOUNCE_MAX = 5000;
export const PANEL_DEBOUNCE_DEFAULT = 250;

export const BACKUP_FILE_EXTENSION = ".zip";
export const BACKUP_TIMESTAMP_REGEX = /_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.zip$/;

export const FRONTMATTER_DELIMITER = "---";
export const FRONTMATTER_REGEX = new RegExp(
  `^${FRONTMATTER_DELIMITER}\n([\\s\\S]*?)\n${FRONTMATTER_DELIMITER}`,
);

export const BYTES_PER_KILOBYTE = 1024;
export const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"];

// Utility functions to get configured names with fallbacks
export function getDraftsFolderName(settings?: { draftsFolderName?: string }): string {
  return settings?.draftsFolderName || FOLDERS.DRAFTS;
}

export function getManuscriptsFolderName(settings?: { manuscriptsFolderName?: string }): string {
  return settings?.manuscriptsFolderName || FOLDERS.MANUSCRIPTS;
}

export function getBackupsFolderName(settings?: { backupsFolderName?: string }): string {
  return settings?.backupsFolderName || FOLDERS.BACKUPS;
}

export function getMetaFileName(settings?: { metaFileName?: string }): string {
  return settings?.metaFileName || FILES.META;
}

export function getOutlineFileName(settings?: { outlineFileName?: string }): string {
  return settings?.outlineFileName || FILES.OUTLINE;
}

/**
 * Turn a draft name into a filesystem-safe filename for per-draft main files.
 * - 'compact': remove whitespace and lowercase (default) -> "Draft 1" => "draft1"
 * - 'kebab': replace whitespace with dashes and lowercase -> "Draft 1" => "draft-1"
 */
export function slugifyDraftName(
  draftName: string,
  style: DraftSlugStyle = SLUG_STYLE.COMPACT,
): string {
  if (!draftName) return "";
  const trimmed = draftName.trim();
  if (style === SLUG_STYLE.KEBAB) {
    return trimmed.replace(/\s+/g, "-").toLowerCase();
  }
  // compact
  return trimmed.replace(/\s+/g, "").toLowerCase();
}

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

/**
 * Suppresses exceptions thrown by a function.
 * @param func The function to execute.
 * @param exceptionsToSuppress The exception types to suppress.
 * @returns The result of the function, or undefined if an exception was suppressed.
 */
export function suppress<T>(
  func: CallableFunction<T>,
  ...exceptionsToSuppress: ExceptionConstructor[]
): T | undefined {
  try {
    return func();
  } catch (e) {
    if (exceptionsToSuppress.length > 0 && exceptionsToSuppress.some((ex) => e instanceof ex)) {
      // The thrown error is one of the types we want to suppress.
      // Silently ignore it.
      return;
    }
    if (exceptionsToSuppress.length === 0) {
      // No specific exceptions were provided, so suppress all.
      return;
    }
    // Re-throw if the error is not one we want to suppress.
    throw e;
  }
}

/**
 * Suppresses exceptions thrown by an async function.
 * @param func The async function to execute.
 * @param exceptionsToSuppress The exception types to suppress.
 * @returns The result of the function, or undefined if an exception was suppressed.
 */
export async function suppressAsync<T>(
  func: CallableFunction<Promise<T>>,
  ...exceptionsToSuppress: ExceptionConstructor[]
): Promise<T | undefined> {
  try {
    return await func();
  } catch (e) {
    if (exceptionsToSuppress.length > 0 && exceptionsToSuppress.some((ex) => e instanceof ex)) {
      // The thrown error is one of the types we want to suppress.
      // Silently ignore it.
      return;
    }
    if (exceptionsToSuppress.length === 0) {
      // No specific exceptions were provided, so suppress all.
      return;
    }
    // Re-throw if the error is not one we want to suppress.
    throw e;
  }
}

/**
 * Generate a unique draft ID using crypto.randomUUID() or fallback to timestamp + random string
 */
export function generateDraftId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Helper function for conditional debug logging.
 * Only logs when the global __WRITEAID_DEBUG__ flag is set to true.
 */
export function debug(...args: unknown[]) {
  suppress(() => {
    if ((window as unknown as { __WRITEAID_DEBUG__?: boolean }).__WRITEAID_DEBUG__) {
      (console.debug || console.log).apply(console, args as []);
    }
  });
}

export function checkActive(project: string | null, draft: string | null): boolean {
  if (!project) {
    new Notice(WriteAidError.ACTIVE_PROJECT_NOT_FOUND);
    return false;
  }
  if (!draft) {
    new Notice(WriteAidError.ACTIVE_DRAFT_NOT_FOUND);
    return false;
  }
  return true;
}

/**
 * Count the words in a text string by splitting on whitespace and filtering out empty strings
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}
