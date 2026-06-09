export class BgTaskFailedError extends Error {
  constructor(backendMessage?: unknown) {
    const message = typeof backendMessage === "string" ? backendMessage.trim() : "";
    super(message || "BG_TASK_FAILED");
    this.name = "BgTaskFailedError";
  }
}
