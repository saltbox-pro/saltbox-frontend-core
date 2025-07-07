import { PaginationState } from '@tanstack/react-table';
import { makeAutoObservable, runInAction } from 'mobx';
import { SettingsSlsRepoShortSchema } from 'saltbox-core-api';
import { apiStore } from './api-store';

export class SettingsSlsStore {
  isLoading: boolean;
  pagination: PaginationState;
  slsreps: Array<SettingsSlsRepoShortSchema>;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.slsreps = [];
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  }

  reload = () => {
    this.loadSLS();
  };

  loadSLS = () => {
    this.isLoading = true;

    apiStore.settingsApi
      ?.slsRepoSettingsListSettingsSlsReposGet({})
      .then((response) => {
        runInAction(() => {
          this.slsreps = response.data;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
    this.loadSLS();
  }

  handleSlsActivation = (id: string, isActive: boolean | undefined) => {
    if (!isActive) {
      apiStore.settingsApi
        ?.slsRepoSettingsActivateSettingsSlsReposSidActivatePost({ sid: id })
        .finally(() => {
          this.reload();
        });
    } else {
      apiStore.settingsApi
        ?.slsRepoSettingsDeactivateSettingsSlsReposSidDeactivatePostRaw({
          sid: id,
        })
        .finally(() => {
          this.reload();
        });
    }
  };

  handleSlsDelete = (id: string) => {
    this.isLoading = true;
    apiStore.settingsApi
      ?.slsRepoSettingsDeleteSettingsSlsReposSidDelete({
        sid: id,
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
        this.reload();
      });
  };
}

export const settingsSlsStore = new SettingsSlsStore();
