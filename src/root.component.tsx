import i18n from "i18next";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Routes, Route } from "react-router";

import "react-querybuilder/dist/query-builder.css";
import DefaultMinionsPage from "saltbox-core/routes/minions";

import CollectionEditPage from "./routes/collection.$slug";
import JobsPage from "./routes/jobs";
import JobsTemplatesPage from "./routes/jobs-templates";
import JobPage from "./routes/jobs.$jid";
import MastersPage from "./routes/masters";
import MinionRedirectPage from "./routes/masters.$master_id.minion.$minion_id";
import PillarsPage from "./routes/pillars";
import MasterPage from "./routes/masters.$mid";
import MinionsPage from "./routes/minions.$slug";
import MinionPage from "./routes/minions.$slug.$mid";
import SettingsSlsPage from "./routes/settings-sls";
import SlsEditorPage from "./routes/sls-editor";
import TaskTemplatesPage from "./routes/task-templates";
import AggregatedPoliciesPage from "./routes/policies";
import AggregatedTasksPage from "./routes/tasks";
import TaskPage from "./routes/task.$taskid";
import NotFound from "./shared/components/not-found";

import "@saltbox/saltbox-frontend-common/dist/saltbox-frontend-common.css";

export default observer(function Root() {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback="Loading translations...">
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
            <Route path="/core/settings-sls" element={<SettingsSlsPage />} />
            <Route path="/core/sls-editor" element={<SlsEditorPage />} />
            <Route path="/core/tasks" element={<AggregatedTasksPage />} />
            <Route path="/core/policies" element={<AggregatedPoliciesPage />} />
            <Route path="/core/task/:taskid" element={<TaskPage />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  );
});
