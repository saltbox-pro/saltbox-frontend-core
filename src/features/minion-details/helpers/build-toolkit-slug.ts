type ToolkitSlugMinion = {
  master?: string | null;
  minion_id?: string | null;
} | null;

export function buildToolkitSlug(minion: ToolkitSlugMinion): string {
  if (!minion?.master || !minion?.minion_id) {
    return "";
  }

  return `${minion.master}:${minion.minion_id}`;
}
