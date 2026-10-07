import {
  SaltboxLocaleProvider,
  createModuleErrorBoundaryKit,
} from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router";

import "react-querybuilder/dist/query-builder.css";
import DefaultMinionsPage from "saltbox-core/routes/minions";
import { i18nStore } from "saltbox-core/store";

import { coreResources } from "./i18n-resources";
import AuditEventsPage from "./routes/audit.events";
import CollectionsPage from "./routes/collections";
import ConfigurationTemplatesPage from "./routes/configuration-templates";
import TemplateSourceDetailPage from "./routes/configuration-templates.$sourceId";
import ExtraDataCategoriesPage from "./routes/extra-data-categories";
import JobsPage from "./routes/jobs";
import JobPage from "./routes/jobs.$jobId";
import MastersPage from "./routes/masters";
import MinionRedirectPage from "./routes/masters.$master_id.minion.$minion_id";
import MasterPage from "./routes/masters.$mid";
import MinionsPage from "./routes/minions.$slug";
import MinionPage from "./routes/minions.$slug.$mid";
import NotFound from "./routes/not-found";
import PillarsPage from "./routes/pillars";
import AggregatedPoliciesPage from "./routes/policies";
import CreateTemplatePage from "./routes/task-template-editor.create";
import DuplicateTemplatePage from "./routes/task-template-editor.duplicate";
import EditTemplatePage from "./routes/task-template-editor.edit";
import TaskPage from "./routes/task.$taskid";
import AggregatedTasksPage from "./routes/tasks";

import "@saltbox/saltbox-frontend-common/dist/saltbox-frontend-common.css";

const MODULE_NAME = "Core";
const MAIN_PATH = "/core/minions";

const { createRoutes } = createModuleErrorBoundaryKit({
  ErrorBoundary,
  moduleName: MODULE_NAME,
  homePath: MAIN_PATH,
  routing: { useNavigate, useLocation },
});

const coreRoutes = createRoutes(Route, [
  { path: MAIN_PATH, element: <DefaultMinionsPage /> },
  { path: `${MAIN_PATH}/:slug/tasks/:taskid`, element: <TaskPage /> },
  { path: `${MAIN_PATH}/:slug/:mid`, element: <MinionPage /> },
  { path: `${MAIN_PATH}/:slug`, element: <MinionsPage /> },
  { path: "/core/masters", element: <MastersPage /> },
  { path: "/core/masters/:mid", element: <MasterPage /> },
  { path: "/core/pillars", element: <PillarsPage /> },
  { path: "/core/collections", element: <CollectionsPage /> },
  { path: "/core/masters/:master_id/minion/:minion_id", element: <MinionRedirectPage /> },
  { path: "/core/jobs", element: <JobsPage /> },
  { path: "/core/jobs/:jobId", element: <JobPage /> },
  { path: "/core/tasks", element: <AggregatedTasksPage /> },
  { path: "/core/policies", element: <AggregatedPoliciesPage /> },
  { path: "/core/task/:taskid", element: <TaskPage /> },
  { path: "/core/configuration-templates", element: <ConfigurationTemplatesPage /> },
  { path: "/core/configuration-templates/:sourceId", element: <TemplateSourceDetailPage /> },
  {
    path: "/core/configuration-templates/:sourceId/templates/new",
    element: <CreateTemplatePage />,
  },
  {
    path: "/core/configuration-templates/:sourceId/templates/:templateId/edit",
    element: <EditTemplatePage />,
  },
  {
    path: "/core/configuration-templates/:sourceId/templates/:templateId/duplicate",
    element: <DuplicateTemplatePage />,
  },
  { path: "/core/audit/events", element: <AuditEventsPage /> },
  { path: "/core/extra-data-categories", element: <ExtraDataCategoriesPage /> },
  { path: "/not-found", element: <NotFound /> },
  { path: "*", element: <NotFound /> },
]);

export default observer(function Root() {
  return (
    <SaltboxLocaleProvider locale={i18nStore.currentLanguage} resources={coreResources}>
      <Suspense fallback="Loading...">
        <BrowserRouter basename="/">
          <Routes>{coreRoutes}</Routes>
        </BrowserRouter>
      </Suspense>
    </SaltboxLocaleProvider>
  );
});
