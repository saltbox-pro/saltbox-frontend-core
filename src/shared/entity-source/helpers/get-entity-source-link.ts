import { parseScenarioSourceId } from "./parse-scenario-source-id";

export type EntitySourceLinkTarget = {
  to: string;
  state?: unknown;
};

export function getEntitySourceLinkTarget(
  type: string,
  sourceId: string
): EntitySourceLinkTarget | null {
  switch (type) {
    case "task":
    case "task_system":
      return { to: `/core/task/${sourceId}` };
    case "scheduler":
      return { to: `/scheduler/list/${sourceId}` };
    case "migration": {
      const { scenarioId, step } = parseScenarioSourceId(sourceId);
      return {
        to: `/scenarios/list/${scenarioId}`,
        state: step ? { step } : undefined,
      };
    }
    default:
      return null;
  }
}
