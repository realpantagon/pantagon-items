/**
 * Deterministic colour for a tag.
 *
 * Hues are picked to stay clear of the red brand accent and of the green/rose
 * pair reserved for profit and loss, so a tag chip never reads as a status.
 */
const TAG_HUES = [205, 262, 320, 32, 172, 232, 288, 48];

export function tagHue(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_HUES[hash % TAG_HUES.length];
}

export function tagChipStyle(tag: string): React.CSSProperties {
  return { ['--tag-h' as string]: tagHue(tag) } as React.CSSProperties;
}
