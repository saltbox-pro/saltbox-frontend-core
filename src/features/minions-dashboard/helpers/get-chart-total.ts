export const getChartTotal = (items: { count: number }[]): number => {
  return items.reduce((sum, item) => sum + item.count, 0);
};
