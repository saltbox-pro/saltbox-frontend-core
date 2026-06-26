export type ChartColorGenerator = (count: number) => string[];

export const generateChartColors: ChartColorGenerator = (count) => {
  return Array.from({ length: count }, (_, i) => `hsl(${(i * 137) % 360}, 70%, 70%)`);
};
