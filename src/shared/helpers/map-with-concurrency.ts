export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await run(items[index] as T);
    }
  };

  const workersCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workersCount }, worker));

  return results;
}
