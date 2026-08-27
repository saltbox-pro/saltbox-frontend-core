export const ENTITY_SOURCE_TYPE_LABEL_KEYS = {
  rest: "entity-source.type.rest",
  task: "entity-source.type.task",
  task_system: "entity-source.type.task",
  scheduler: "entity-source.type.scheduler",
  migration: "entity-source.type.migration",
  system: "entity-source.type.system",
} as const;

export type EntitySourceTypeValue = keyof typeof ENTITY_SOURCE_TYPE_LABEL_KEYS;

export const TASK_SOURCE_TYPE_FILTER_VALUES = [
  "rest",
  "scheduler",
  "system",
] as const satisfies ReadonlyArray<EntitySourceTypeValue>;

export const JOB_SOURCE_TYPE_FILTER_VALUES = [
  "rest",
  "task",
  "scheduler",
  "migration",
  "system",
] as const satisfies ReadonlyArray<EntitySourceTypeValue>;

export function isEntitySourceTypeValue(type: string): type is EntitySourceTypeValue {
  return Object.prototype.hasOwnProperty.call(ENTITY_SOURCE_TYPE_LABEL_KEYS, type);
}
