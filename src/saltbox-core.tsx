import { SaltboxLocaleProvider } from "@saltbox/saltbox-frontend-common";
import { autorun, runInAction } from "mobx";
import { observer } from "mobx-react";
import React, { Suspense } from "react";
import ReactDOMClient from "react-dom/client";
import "@ant-design/v5-patch-for-react-19";
import { BrowserRouter } from "react-router";
import singleSpaReact from "single-spa-react";

import {
  JobReturnOutput,
  type JobReturnOutputProps,
} from "saltbox-core/shared/components/job-return";
import {
  OpenRelatedJobsButton,
  type OpenRelatedJobsButtonProps,
} from "saltbox-core/shared/components/jobs/open-related-jobs-button";
import { appStore, envStore, i18nStore } from "saltbox-core/store";
import { MinionsTreeMenu } from "saltbox-core/widgets/minions/tree-menu";

import {
  MinionDetailsDrawerWrapper,
  type MinionDetailsDrawerWrapperProps,
} from "./features/minion-details-drawer";
import { coreResources } from "./i18n-resources";
import Root from "./root.component";

const coreLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Root,
  domElementGetter: () => document.getElementById("app-container"),
});

const collectionSelectorRootComponent = observer(({ onClose }) => (
  <SaltboxLocaleProvider locale={i18nStore.currentLanguage} resources={coreResources}>
    <Suspense fallback="Loading...">
      <BrowserRouter>
        <MinionsTreeMenu onClose={onClose} />
      </BrowserRouter>
    </Suspense>
  </SaltboxLocaleProvider>
));

const MinionDetailsDrawerWrapperProvider = observer(
  (props: { customProps?: MinionDetailsDrawerWrapperProps }) => {
    const { customProps } = props ?? {};

    return (
      <SaltboxLocaleProvider locale={i18nStore.currentLanguage} resources={coreResources}>
        <Suspense fallback="Loading...">
          <BrowserRouter>
            <MinionDetailsDrawerWrapper {...customProps} />
          </BrowserRouter>
        </Suspense>
      </SaltboxLocaleProvider>
    );
  }
);

const OpenRelatedJobsButtonProvider = observer(
  (props: { customProps?: OpenRelatedJobsButtonProps }) => {
    const { customProps } = props ?? {};

    return (
      <SaltboxLocaleProvider locale={i18nStore.currentLanguage} resources={coreResources}>
        <Suspense fallback="Loading...">
          <BrowserRouter>
            {!!customProps && <OpenRelatedJobsButton {...customProps} />}
          </BrowserRouter>
        </Suspense>
      </SaltboxLocaleProvider>
    );
  }
);

const JobReturnOutputProvider = observer((props: { customProps?: JobReturnOutputProps | null }) => {
  const { customProps } = props ?? {};

  if (!customProps?.jobReturn) {
    return null;
  }

  return (
    <SaltboxLocaleProvider locale={i18nStore.currentLanguage} resources={coreResources}>
      <Suspense fallback="Loading...">
        <BrowserRouter>
          <JobReturnOutput {...customProps} />
        </BrowserRouter>
      </Suspense>
    </SaltboxLocaleProvider>
  );
});

const plugins = {
  "minions.details-drawer": [
    {
      key: "minion-details-drawer",
      wrapWith: "div",
      parcel: singleSpaReact({
        React,
        ReactDOMClient,
        rootComponent: MinionDetailsDrawerWrapperProvider,
      }),
    },
  ],
  "jobs.open-related": [
    {
      key: "open-related-jobs-button",
      wrapWith: "div",
      parcel: singleSpaReact({
        React,
        ReactDOMClient,
        rootComponent: OpenRelatedJobsButtonProvider,
      }),
    },
  ],
  "jobs.job-return-output": [
    {
      key: "job-return-output",
      wrapWith: "div",
      parcel: singleSpaReact({
        React,
        ReactDOMClient,
        rootComponent: JobReturnOutputProvider,
      }),
    },
  ],
};

const collectionSelectorLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: collectionSelectorRootComponent,
});

export const saltboxModule = {
  singleSpaLifecycle: coreLifecycles,
  name: "saltbox-frontend-core",
  path: "/core",
  plugins,
  menuConfig: {
    priority: 20,
    key: "core-module",
    label: "Core",
    children: [
      {
        key: "minions",
        label: { en: "Minions", ru: "Клиенты" },
        icon: "computer",
        drawer: {
          bootstrap: collectionSelectorLifecycles.bootstrap,
          mount: collectionSelectorLifecycles.mount,
          unmount: collectionSelectorLifecycles.unmount,
        },
        path: "/core/minions",
      },
      {
        key: "jobs",
        label: { en: "Jobs", ru: "Команды" },
        icon: "build_circle",
        path: "/core/jobs",
      },
      {
        key: "tasks",
        label: { en: "Tasks", ru: "Задачи" },
        icon: "assignment",
        path: "/core/tasks",
      },
      {
        key: "policies",
        label: { en: "Policies", ru: "Политики" },
        icon: "policy",
        path: "/core/policies",
      },
      {
        key: "pillars",
        label: { en: "Pillars", ru: "Pillars" },
        icon: "key",
        path: "/core/pillars",
      },
    ],
  },
  settingsConfig: {
    priority: 20,
    key: "core",
    label: "Core",
    children: [
      {
        key: "masters",
        label: { en: "Masters", ru: "Мастера" },
        icon: "dns",
        path: "/core/masters",
      },
      {
        key: "jobs-templates",
        label: { en: "Jobs Templates", ru: "Шаблоны команд" },
        icon: "build",
        path: "/core/jobs-templates",
      },
      {
        key: "task-templates",
        label: { en: "Task Templates", ru: "Шаблоны задач" },
        icon: "assignment_globe",
        path: "/core/task-templates",
      },
      {
        key: "configuration-templates",
        label: { en: "Configuration Templates", ru: "Шаблоны конфигураций" },
        icon: "source",
        path: "/core/configuration-templates",
      },
    ],
  },
  init: (authStore, services, localeStore, pluginsStore) => {
    appStore.init(authStore, pluginsStore);
    runInAction(() => {
      for (const service of services) {
        envStore.services.set(service.service_name, service.env);
      }
    });
    autorun(() => {
      i18nStore.setLanguage(localeStore.currentLocale);
    });
  },
};
