export const runInBatches = async <TItem, TResult>(
  items: TItem[],
  run: (item: TItem) => Promise<TResult>,
  batchSize: number
): Promise<PromiseSettledResult<TResult>[]> => {
  const results: PromiseSettledResult<TResult>[] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.allSettled(batch.map(async (item) => run(item)))));
  }

  return results;
};
