export const runWithConcurrency = async <TItem, TResult>(
  items: TItem[],
  run: (item: TItem) => Promise<TResult>,
  limit: number
): Promise<PromiseSettledResult<TResult>[]> => {
  const results: PromiseSettledResult<TResult>[] = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = { status: "fulfilled", value: await run(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };

  const workersCount = Math.min(Math.max(1, limit), items.length);
  await Promise.all(Array.from({ length: workersCount }, runWorker));

  return results;
};
