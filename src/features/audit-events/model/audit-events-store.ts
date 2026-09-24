import type {
  AuditEventModel,
  TimeseriesCursorInput,
  TimeseriesCursorOutput,
} from "@saltbox/saltbox-audit-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { action, computed, makeObservable, observable } from "mobx";

import { apiAuditStore } from "saltbox-core/store";

import { AUDIT_EVENTS_SORT, DEFAULT_AUDIT_EVENTS_PAGE_SIZE } from "../constants/audit-events";

type AuditEventsPageRequest = {
  after?: TimeseriesCursorInput;
  before?: TimeseriesCursorInput;
};

const toCursorInput = (cursor: TimeseriesCursorOutput): TimeseriesCursorInput => ({
  time: new Date(cursor.time),
  id: cursor.id,
});

export class AuditEventsStore {
  @observable.ref events: AuditEventModel[] = [];
  @observable.ref nextCursor: TimeseriesCursorOutput | null = null;
  @observable.ref previousCursor: TimeseriesCursorOutput | null = null;
  @observable pageSize = DEFAULT_AUDIT_EVENTS_PAGE_SIZE;
  @observable.ref query: Record<string, unknown> = {};

  readonly eventsLoad = createLoader({
    run: (page: AuditEventsPageRequest = {}) =>
      apiAuditStore.auditEventsApi?.auditEventsList({
        AuditEventListBody: {
          query: this.query,
          sort: AUDIT_EVENTS_SORT,
          limit: this.pageSize,
          ...page,
        },
      }),
    onSuccess: (response) => {
      this.events = response.data;
      this.nextCursor = response.next_cursor ?? null;
      this.previousCursor = response.previous_cursor ?? null;
    },
  });

  constructor() {
    makeObservable(this);
  }

  @computed get isLoading(): boolean {
    return this.eventsLoad.isLoading;
  }

  @computed get hasNextPage(): boolean {
    return this.nextCursor !== null;
  }

  @computed get hasPreviousPage(): boolean {
    return this.previousCursor !== null;
  }

  @action
  applyQuery = (query: object) => {
    this.query = query as Record<string, unknown>;
    this.loadFirstPage();
  };

  @action
  setPageSize = (pageSize: number) => {
    this.pageSize = pageSize;
    this.loadFirstPage();
  };

  reload = () => {
    this.loadFirstPage();
  };

  loadNextPage = () => {
    if (this.nextCursor) {
      this.loadPage({ after: toCursorInput(this.nextCursor) });
    }
  };

  loadPreviousPage = () => {
    if (this.previousCursor) {
      this.loadPage({ before: toCursorInput(this.previousCursor) });
    }
  };

  @action
  private loadFirstPage = () => {
    this.nextCursor = null;
    this.previousCursor = null;
    this.loadPage();
  };

  private loadPage = (page: AuditEventsPageRequest = {}) => {
    this.eventsLoad.run(page).catch(() => undefined);
  };
}
