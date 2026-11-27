export class TasksApiUnavailableError extends Error {
  constructor() {
    super("Tasks API is not available");
    this.name = "TasksApiUnavailableError";
  }
}
