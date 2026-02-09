import i18n from "i18next";
import { autorun, runInAction } from "mobx";
import React, { Suspense } from "react";
import ReactDOMClient from "react-dom/client";
import "@ant-design/v5-patch-for-react-19";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router";
import singleSpaReact from "single-spa-react";

import { CollectionSelector } from "saltbox-core/shared/components/collection-selector/collection-selector";
import { appStore, envStore, i18nStore } from "saltbox-core/store";

import Root from "./root.component";

const coreLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Root,
  domElementGetter: () => document.getElementById("app-container"),
});

const collectionSelectorRootComponent = ({ onClose }) => (
  <I18nextProvider i18n={i18n}>
    <Suspense fallback="Loading translations...">
      <BrowserRouter>
        <CollectionSelector onClose={onClose} />
      </BrowserRouter>
    </Suspense>
  </I18nextProvider>
);

const collectionSelectorLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: collectionSelectorRootComponent,
});

//export const { bootstrap, mount, unmount } = coreLifecycles;

export const saltboxModule = {
  singleSpaLifecycle: coreLifecycles,
  name: "saltbox-frontend-core",
  path: "/core",
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
        key: "masters",
        label: { en: "Masters", ru: "Мастера" },
        icon: "dns",
        path: "/core/masters",
      },
      {
        key: "jobs",
        label: { en: "Jobs", ru: "Команды" },
        icon: "build_circle",
        path: "/core/jobs",
      },
    ],
  },
  settingsConfig: {
    priority: 20,
    key: "core",
    label: "Core",
    children: [
      {
        key: "jobs-templates",
        label: { en: "Jobs Templates", ru: "Шаблоны команд" },
        path: "/core/jobs-templates",
      },

      {
        key: "task-templates",
        label: { en: "Task Templates", ru: "Шаблоны задач" },
        path: "/core/task-templates",
      },
      {
        key: "settings-sls",
        label: { en: "Settings SLS", ru: "Репозитории конфигураций" },
        path: "/core/settings-sls",
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
      i18nStore.currentLanguage = localeStore.currentLocale;
    });
  },
};
