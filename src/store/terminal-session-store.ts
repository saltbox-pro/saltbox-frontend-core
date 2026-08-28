import {
  CreateJobRequestTgtTypeEnum,
  JobModel,
  JobReturnModel,
  JobReturnStatus,
  JobStatus,
} from "@saltbox/saltbox-core-api-client";
import { WebSocketMessage, WebSocketService } from "@saltbox/saltbox-frontend-common";
import { action, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore, appStore } from "saltbox-core/store";

const TERMINAL_INTERRUPT_GRACE_MS = 1000;
const TERMINAL_MAX_SCREEN_LINES = 2000;

export type TerminalLineKind = "input" | "output" | "error" | "info" | "greeting";

export interface TerminalLine {
  id: number;
  kind: TerminalLineKind;
  text?: string;
  localeKey?: string;
  localeParams?: Record<string, unknown>;
}

export type TerminalSessionStatus = "idle" | "creating" | "running" | "interrupting";

export type TerminalInterruptEcho = "^C" | "^Z";

export interface TerminalRunOptions {
  kwarg?: Record<string, unknown>;
  ttl?: number;
}

export class TerminalSessionStore {
  @observable screenLines: TerminalLine[];
  @observable status: TerminalSessionStatus;
  @observable jid: string | null;
  @observable commandHistory: string[];

  private readonly minionId: string;
  private readonly saltMaster: string;
  private webSocketService: WebSocketService<JobModel | JobReturnModel> | null = null;
  private interruptGraceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingInterruptEcho: TerminalInterruptEcho | null = null;
  private resultHandled = false;
  private nextLineId = 0;
  private isGreetingPrinted = false;
  private lastSettingsInfoKey: string | null = null;

  constructor(minionId: string, saltMaster: string) {
    this.minionId = minionId;
    this.saltMaster = saltMaster;
    this.screenLines = [];
    this.status = "idle";
    this.jid = null;
    this.commandHistory = [];
    makeObservable(this);
  }

  @action
  handleRunCommand = (rawCommand: string, runOptions?: TerminalRunOptions) => {
    if (this.status !== "idle") {
      return;
    }

    const command = rawCommand.trim();
    this.appendLine({ kind: "input", text: rawCommand });

    if (!command) {
      return;
    }

    if (command === "clear") {
      this.handleClearScreen();
      return;
    }

    if (this.commandHistory[this.commandHistory.length - 1] !== command) {
      this.commandHistory.push(command);
    }

    if (!apiCoreStore.jobsApi) {
      this.appendLine({ kind: "error", localeKey: "terminal.create-error" });
      return;
    }

    this.status = "creating";
    this.resultHandled = false;

    apiCoreStore.jobsApi
      .jobCreate({
        CreateJobRequest: {
          tgt: this.minionId,
          tgt_type: CreateJobRequestTgtTypeEnum.Glob,
          fun: "cmd.run",
          salt_master: this.saltMaster,
          ...(runOptions?.kwarg
            ? { kwarg: { cmd: command, ...runOptions.kwarg } }
            : { arg: [command] }),
          ...(runOptions?.ttl != null ? { ttl: runOptions.ttl } : {}),
        },
      })
      .then((job) => {
        runInAction(() => {
          this.applyCreatedJob(job);
        });
      })
      .catch((error) => {
        console.error("Error creating terminal job:", error);
        runInAction(() => {
          this.appendLine({ kind: "error", localeKey: "terminal.create-error" });
          this.finishRun();
        });
      });
  };

  @action
  handleStopCommand = (echo: TerminalInterruptEcho) => {
    if (this.status === "creating") {
      if (this.pendingInterruptEcho) {
        return;
      }
      this.pendingInterruptEcho = echo;
      this.appendLine({ kind: "info", text: echo });
      return;
    }

    if (this.status !== "running") {
      return;
    }

    this.status = "interrupting";
    this.pendingInterruptEcho = echo;
    this.appendLine({ kind: "info", text: echo });
    this.createKillJob();
  };

  @action
  handleClearScreen = () => {
    this.screenLines = [];
  };

  @action
  handleIdleInterrupt = (typedText: string) => {
    this.appendLine({ kind: "input", text: `${typedText}^C` });
  };

  @action
  printGreeting = (lines: string[]) => {
    if (this.isGreetingPrinted || !lines.length || this.screenLines.length) {
      return;
    }

    this.isGreetingPrinted = true;
    lines.forEach((text) => this.appendLine({ kind: "greeting", text }));
    this.appendLine({ kind: "greeting", text: " " });
  };

  @action
  printSettingsInfo = (lines: string[]) => {
    const settingsKey = lines.join("\n");

    if (!settingsKey || settingsKey === this.lastSettingsInfoKey) {
      return;
    }

    this.lastSettingsInfoKey = settingsKey;
    lines.forEach((text) => this.appendLine({ kind: "info", text }));
  };

  @action
  private applyCreatedJob = (job: JobModel | null | undefined) => {
    if (!job?.jid || job.status === JobStatus.LaunchError) {
      this.appendLine({ kind: "error", localeKey: "terminal.launch-error" });
      this.finishRun();
      return;
    }

    if (job.missing?.includes(this.minionId)) {
      this.appendLine({ kind: "error", localeKey: "terminal.minion-offline" });
      this.finishRun();
      return;
    }

    this.jid = job.jid;
    this.status = this.pendingInterruptEcho ? "interrupting" : "running";
    this.connectJobSocket(job.jid);

    if (this.pendingInterruptEcho) {
      this.createKillJob();
    }
  };

  private createKillJob = () => {
    if (!this.jid || !apiCoreStore.jobsApi) {
      this.appendLine({ kind: "error", localeKey: "terminal.interrupt-error" });
      this.status = "running";
      this.pendingInterruptEcho = null;
      return;
    }

    apiCoreStore.jobsApi
      .jobCreate({
        CreateJobRequest: {
          tgt: this.minionId,
          tgt_type: CreateJobRequestTgtTypeEnum.Glob,
          fun: "saltutil.kill_job",
          salt_master: this.saltMaster,
          arg: [this.jid],
        },
      })
      .then(() => {
        runInAction(() => {
          if (this.status !== "interrupting") {
            return;
          }
          this.interruptGraceTimer = setTimeout(() => {
            runInAction(() => {
              this.finishRun();
            });
          }, TERMINAL_INTERRUPT_GRACE_MS);
        });
      })
      .catch((error) => {
        console.error("Error creating terminal kill job:", error);
        runInAction(() => {
          if (this.status !== "interrupting") {
            return;
          }
          this.appendLine({ kind: "error", localeKey: "terminal.interrupt-error" });
          this.status = "running";
          this.pendingInterruptEcho = null;
        });
      });
  };

  private connectJobSocket = (jid: string) => {
    const webSocketService = new WebSocketService<JobModel | JobReturnModel>();
    this.webSocketService = webSocketService;
    webSocketService.connect(
      `${apiCoreStore.env?.ws_server_url}/jobs/${jid}/info`,
      appStore.authStore?.user?.access_token,
      {
        onMessage: (messages: Array<WebSocketMessage<JobModel | JobReturnModel>>) => {
          messages
            .filter((message) => message.message_tag === "job-return")
            .forEach((message) => this.applyJobReturn(message.payload as JobReturnModel));

          messages
            .filter((message) => message.message_tag === "job")
            .forEach((message) => this.applyJobUpdate(message.payload as JobModel));
        },
        onOpen: () => {
          this.loadJobReturns(jid);
        },
      }
    );
  };

  private loadJobReturns = (jid: string, onLoaded?: () => void) => {
    apiCoreStore.jobsApi
      ?.jobReturnsList({
        JobReturnsListBody: {
          query: { jid, minion_id: this.minionId },
          limit: 10,
          skip: 0,
        },
      })
      .then((response) => {
        runInAction(() => {
          response.data.forEach((jobReturn) => this.applyJobReturn(jobReturn));
          onLoaded?.();
        });
      })
      .catch((error) => {
        console.error("Error loading terminal job returns:", error);
        runInAction(() => {
          onLoaded?.();
        });
      });
  };

  @action
  private applyJobReturn = (jobReturn: JobReturnModel) => {
    if (jobReturn.jid !== this.jid || jobReturn.minion_id !== this.minionId) {
      return;
    }

    if (this.resultHandled || jobReturn.status === JobReturnStatus.Waiting) {
      return;
    }

    this.resultHandled = true;

    if (jobReturn.status === JobReturnStatus.Timeout) {
      this.appendLine({ kind: "error", localeKey: "terminal.timeout" });
      this.finishRun();
      return;
    }

    if (jobReturn.status === JobReturnStatus.Ignored) {
      if (this.status !== "interrupting") {
        this.appendLine({ kind: "error", localeKey: "terminal.no-return" });
      }
      this.finishRun();
      return;
    }

    this.loadAndPrintJobReturnData(jobReturn);
  };

  private loadAndPrintJobReturnData = (jobReturn: JobReturnModel) => {
    if (!apiCoreStore.jobsApi) {
      this.printJobReturnData(jobReturn, jobReturn.data);
      this.finishRun();
      return;
    }

    apiCoreStore.jobsApi
      .jobReturnData({ job_return_mongo_id: jobReturn.id })
      .then((data) => {
        runInAction(() => {
          this.printJobReturnData(jobReturn, data);
          this.finishRun();
        });
      })
      .catch((error) => {
        console.error("Error loading terminal job return data:", error);
        runInAction(() => {
          if (jobReturn.data != null) {
            this.printJobReturnData(jobReturn, jobReturn.data);
          } else {
            this.appendLine({ kind: "error", localeKey: "terminal.result-load-error" });
          }
          this.finishRun();
        });
      });
  };

  @action
  private applyJobUpdate = (job: JobModel) => {
    if (job.jid !== this.jid) {
      return;
    }

    if (job.status === JobStatus.LaunchError) {
      if (!this.resultHandled) {
        this.appendLine({ kind: "error", localeKey: "terminal.launch-error" });
        this.resultHandled = true;
      }
      this.finishRun();
      return;
    }

    if (job.status !== JobStatus.Finished) {
      return;
    }

    if (this.resultHandled) {
      return;
    }

    this.loadJobReturns(job.jid, () => {
      if (this.resultHandled) {
        return;
      }
      if (this.status !== "interrupting") {
        this.appendLine({
          kind: "error",
          localeKey: job.missing?.includes(this.minionId)
            ? "terminal.minion-offline"
            : "terminal.no-return",
        });
      }
      this.resultHandled = true;
      this.finishRun();
    });
  };

  @action
  private printJobReturnData = (jobReturn: JobReturnModel, data: unknown) => {
    const kind: TerminalLineKind = jobReturn.retcode === 0 ? "output" : "error";
    const text =
      typeof data === "string" ? data : data == null ? "" : JSON.stringify(data, null, 2);
    const textLines = text ? text.split("\n") : [];

    textLines.forEach((textLine) => this.appendLine({ kind, text: textLine }));

    if (!textLines.length && jobReturn.retcode != null && jobReturn.retcode !== 0) {
      this.appendLine({
        kind: "error",
        localeKey: "terminal.exit-code",
        localeParams: { code: jobReturn.retcode },
      });
    }
  };

  @action
  private finishRun = () => {
    if (this.status === "idle") {
      return;
    }

    if (this.status === "interrupting") {
      this.appendLine({ kind: "info", localeKey: "terminal.interrupted" });
    }

    if (this.interruptGraceTimer) {
      clearTimeout(this.interruptGraceTimer);
      this.interruptGraceTimer = null;
    }

    this.status = "idle";
    this.jid = null;
    this.pendingInterruptEcho = null;
    this.webSocketService?.disconnect();
    this.webSocketService = null;
  };

  @action
  private appendLine = (line: Omit<TerminalLine, "id">) => {
    this.screenLines.push({ ...line, id: this.nextLineId++ });
    if (this.screenLines.length > TERMINAL_MAX_SCREEN_LINES) {
      this.screenLines.splice(0, this.screenLines.length - TERMINAL_MAX_SCREEN_LINES);
    }
  };
}

const terminalSessions = new Map<string, TerminalSessionStore>();

export function getTerminalSessionStore(
  minionMongoId: string,
  minionId: string,
  saltMaster: string
): TerminalSessionStore {
  let store = terminalSessions.get(minionMongoId);
  if (!store) {
    store = new TerminalSessionStore(minionId, saltMaster);
    terminalSessions.set(minionMongoId, store);
  }
  return store;
}
