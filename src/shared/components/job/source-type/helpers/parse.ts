export function parseScenarioSourceId(sourceId: string): { scenarioId: string; step?: string } {
  const [scenarioIdRaw, stepRaw] = sourceId.split(":");
  const scenarioId = scenarioIdRaw || sourceId;
  const step = (stepRaw ?? "").trim();

  return step ? { scenarioId, step } : { scenarioId };
}
