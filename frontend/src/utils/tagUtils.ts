/**
 * Centralized Utility Functions for Tag Normalization, Parsing, Styling, and AST Transformations.
 */

/**
 * Match Unicode hashtags: letters, numbers, underscores, and hyphens.
 */
export const HASHTAG_REGEX = /#([\p{L}\p{N}_-]+)/gu;

/**
 * Normalizes a raw tag string into canonical kebab-case format.
 * Trims whitespace, strips leading '#', converts spaces to hyphens, and lowercases.
 *
 * Example: " Self Care " -> "self-care", "#Work" -> "work"
 */
export function sanitizeTag(rawTag: string): string {
  if (!rawTag) return '';
  return rawTag
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Extracts unique, normalized hashtags from plain prose text.
 */
export function parseHashTags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(HASHTAG_REGEX) || [];
  const tags = matches.map(m => sanitizeTag(m)).filter(Boolean);
  return [...new Set(tags)];
}

/**
 * Calculates optimal text color (#1e293b dark vs #ffffff white) for dynamic tag background colors
 * using the YIQ luminance contrast formula with a 140 threshold.
 */
export function getContrastTextColor(hexColor?: string | null): string {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#1e293b' : '#ffffff';
}

/**
 * Computes inline CSS style object for tag pills based on custom hex color or theme accent default.
 */
export function formatTagStyle(color?: string | null): React.CSSProperties {
  if (!color) {
    return { backgroundColor: 'var(--accent-tint)', color: 'var(--accent)' };
  }
  const textColor = getContrastTextColor(color);
  return {
    backgroundColor: `${color}20`,
    color: textColor === '#1e293b' ? color : color, // keep crisp color for pill border/text
  };
}

export interface TiptapAstNode {
  type?: string;
  text?: string;
  content?: TiptapAstNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Recursively updates or strips hashtag occurrences in a Tiptap / ProseMirror AST JSON tree.
 * If newTag is null, converts `#oldTag` text to `oldTag` (strips leading # without erasures).
 */
export function replaceHashtagInTiptapAst(
  node: TiptapAstNode,
  oldTag: string,
  newTag: string | null
): TiptapAstNode {
  if (!node || typeof node !== 'object') return node;

  const copy: TiptapAstNode = { ...node };

  if (copy.type === 'text' && typeof copy.text === 'string') {
    const escaped = oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`#${escaped}(?=[\\s.,!?;:]|$)`, 'gi');

    if (newTag === null) {
      copy.text = copy.text.replace(regex, oldTag);
    } else {
      const sanitizedNew = sanitizeTag(newTag);
      copy.text = copy.text.replace(regex, `#${sanitizedNew}`);
    }
  }

  if (Array.isArray(copy.content)) {
    copy.content = copy.content.map((child: TiptapAstNode) =>
      replaceHashtagInTiptapAst(child, oldTag, newTag)
    );
  }

  return copy;
}
