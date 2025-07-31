import React, { Suspense } from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact from "single-spa-react";
import Root from "./root.component";
import { CollectionSelector } from "saltbox-core/shared/components/collection-selector/collection-selector";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { BrowserRouter } from "react-router";

const mainLifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Root,
  domElementGetter: () => document.getElementById("app-container"),
});

export const { bootstrap, mount, unmount } = mainLifecycles;

const collectionSelectorRootComponent = ({ onClose }) => (
  <I18nextProvider i18n={i18n}>
    <Suspense fallback="Loading translations...">
      <BrowserRouter basename="/core">
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

export const meta = {
  name: "saltbox-frontend-core",
  path: "/core",
  menuConfig: {
    key: "core",
    label: "Core",
    children: [
      {
        key: "minions",
        label: "Minions",
        icon: "computer",
        drawer: {
          bootstrap: collectionSelectorLifecycles.bootstrap,
          mount: collectionSelectorLifecycles.mount,
          unmount: collectionSelectorLifecycles.unmount,
        },
      },
      {
        key: "masters",
        label: "Masters",
        icon: "dns",
        path: "/core/masters",
      },
      {
        key: "jobs",
        label: "Jobs",
        icon: "build_circle",
        path: "/core/jobs",
      },
      {
        key: "jobs-templates",
        label: "Jobs Templates",
        icon: "task",
        path: "/core/jobs-templates",
      },

      {
        key: "task-templates",
        label: "Task Templates",
        icon: "task",
        path: "/core/task-templates",
      },
      {
        key: "settings-sls",
        label: "Settings SLS",
        icon: "settings",
        path: "/core/settings-sls",
      },
    ],
  },
};
