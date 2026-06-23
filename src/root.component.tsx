import { SaltboxLocaleProvider } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import "react-querybuilder/dist/query-builder.css";
import DefaultMinionsPage from "saltbox-core/routes/minions";
import { i18nStore } from "saltbox-core/store";

import { coreResources } from "./i18n-resources";
import CollectionEditPage from "./routes/collection.$slug";
import ConfigurationTemplatesPage from "./routes/configuration-templates";
import TemplateSourceDetailPage from "./routes/configuration-templates.$sourceId";
import JobsPage from "./routes/jobs";
import JobsTemplatesPage from "./routes/jobs-templates";
import JobPage from "./routes/jobs.$jid";
import MastersPage from "./routes/masters";
import MinionRedirectPage from "./routes/masters.$master_id.minion.$minion_id";
import MasterPage from "./routes/masters.$mid";
import MinionsPage from "./routes/minions.$slug";
import MinionPage from "./routes/minions.$slug.$mid";
import NotFound from "./routes/not-found";
import PillarsPage from "./routes/pillars";
import AggregatedPoliciesPage from "./routes/policies";
import SlsEditorPage from "./routes/sls-editor";
import CreateTemplatePage from "./routes/task-template-editor.create";
import DuplicateTemplatePage from "./routes/task-template-editor.duplicate";
import EditTemplatePage from "./routes/task-template-editor.edit";
import TaskTemplatesPage from "./routes/task-templates";
import TaskPage from "./routes/task.$taskid";
import AggregatedTasksPage from "./routes/tasks";

import "@saltbox/saltbox-frontend-common/dist/saltbox-frontend-common.css";

export default observer(function Root() {
  return (
    <SaltboxLocaleProvider locale={i18nStore.currentLanguage} resources={coreResources}>
      <Suspense fallback="Loading...">
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/core/minions" element={<DefaultMinionsPage />} />
            <Route path="/core/minions/:slug/edit" element={<CollectionEditPage />} />
            <Route path="/core/minions/:slug/tasks/:taskid" element={<TaskPage />} />
            <Route path="/core/minions/:slug/:mid" element={<MinionPage />} />
            <Route path="/core/minions/:slug" element={<MinionsPage />} />
            <Route path="/core/masters" element={<MastersPage />} />
            <Route path="/core/masters/:mid" element={<MasterPage />} />
            <Route path="/core/pillars" element={<PillarsPage />} />
            <Route
              path="/core/masters/:master_id/minion/:minion_id"
              element={<MinionRedirectPage />}
            />
            <Route path="/core/jobs" element={<JobsPage />} />
            <Route path="/core/jobs/:jid" element={<JobPage />} />
            <Route path="/core/jobs-templates" element={<JobsTemplatesPage />} />
            <Route path="/core/task-templates" element={<TaskTemplatesPage />} />
            <Route path="/core/sls-editor" element={<SlsEditorPage />} />
            <Route path="/core/tasks" element={<AggregatedTasksPage />} />
            <Route path="/core/policies" element={<AggregatedPoliciesPage />} />
            <Route path="/core/task/:taskid" element={<TaskPage />} />
            <Route path="/core/configuration-templates" element={<ConfigurationTemplatesPage />} />
            <Route
              path="/core/configuration-templates/:sourceId"
              element={<TemplateSourceDetailPage />}
            />
            <Route
              path="/core/configuration-templates/:sourceId/templates/new"
              element={<CreateTemplatePage />}
            />
            <Route
              path="/core/configuration-templates/:sourceId/templates/:templateId/edit"
              element={<EditTemplatePage />}
            />
            <Route
              path="/core/configuration-templates/:sourceId/templates/:templateId/duplicate"
              element={<DuplicateTemplatePage />}
            />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </SaltboxLocaleProvider>
  );
});
