export function trimRequired(value: string): string {
  return value.trim();
}

export function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
