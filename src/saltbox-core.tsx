import React from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact from "single-spa-react";
import Root from "./root.component";

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: Root,
  errorBoundary(err, info, props) {
    // Customize the root error boundary for your microfrontend here.
    return null;
  },
  domElementGetter: () => document.getElementById("app-container"),
});

export const { bootstrap, mount, unmount } = lifecycles;

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
        path: "/core/minions/root",
      },
      {
        key: "masters",
        label: "Masters",
        path: "/core/masters",
      },
      {
        key: "jobs",
        label: "Jobs",
        path: "/core/jobs",
      },
      {
        key: "jobs-templates",
        label: "Jobs Templates",
        path: "/core/jobs-templates",
      },

      {
        key: "task-templates",
        label: "Task Templates",
        path: "/core/task-templates",
      },
      {
        key: "settings-sls",
        label: "Settings SLS",
        path: "/core/settings-sls",
      },
    ],
  },
};
