import { PaginationState } from '@tanstack/react-table';
import { makeAutoObservable, runInAction } from 'mobx';
import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import { apiStore } from './api-store';

export class MastersStore {
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  masters: Array<MasterViewSchema>;
  totalMasters: number;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.error = null;
    this.masters = [];
    this.totalMasters = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  }

  rejectMaster = (id: string): Promise<MasterViewSchema> => {
    this.isLoading = true;
    const result = new Promise<MasterViewSchema>((resolve, reject) => {
      apiStore.mastersApi
        ?.taskReject({
          mid: id,
        })
        .then((master) => {
          runInAction(() => {
            this.isLoading = false;
          });
          this.updateMaster(master);
          resolve(master);
        })
        .catch(() => {
          runInAction(() => {
            this.isLoading = false;
          });
          reject();
        });
    });
    return result;
  };

  acceptMaster = (id: string): Promise<MasterViewSchema> => {
    this.isLoading = true;
    const result = new Promise<MasterViewSchema>((resolve, reject) => {
      apiStore.mastersApi
        ?.taskAccept({
          mid: id,
        })
        .then((master) => {
          runInAction(() => {
            this.isLoading = false;
          });
          this.updateMaster(master);
          resolve(master);
        })
        .catch(() => {
          runInAction(() => {
            this.isLoading = false;
          });
          reject();
        });
    });
    return result;
  };

  loadMasters = () => {
    this.isLoading = true;
    this.error = null;

    apiStore.mastersApi
      ?.mastersList({
        limit: this.pagination.pageSize,
        skip: this.pagination.pageIndex * this.pagination.pageSize,
      })
      .then((response) => {
        runInAction(() => {
          this.isLoading = false;
          this.masters = response.data;
          this.totalMasters = response.total;
        });
      })
      .catch((error) => {
        runInAction(() => {
          this.isLoading = false;
          this.error = "Failed to load masters";
        });
      });
  };

  updateMaster = (master: MasterViewSchema) => {
    const index = this.masters.findIndex((m) => m.id === master.id);
    if (index !== -1) {
      this.masters[index] = master;
    }
  };

  handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
    this.loadMasters();
  }
}
