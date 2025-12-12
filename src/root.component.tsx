import i18n from "i18next";
import { observer } from "mobx-react";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Routes, Route } from "react-router";

import "react-querybuilder/dist/query-builder.css";
import DefaultMinionsPage from "saltbox-core/routes/minions";

import CollectionEditPage from "./routes/collection.$slug";
import JobPage from "./routes/job.$jobid";
import JobsPage from "./routes/jobs";
import JobsTemplatesPage from "./routes/jobs-templates";
import MinionRedirectPage from "./routes/master.$master_id.minion.$minion_id";
import MasterPage from "./routes/master.$mid";
import MastersPage from "./routes/masters";
import MinionPage from "./routes/minion.$slug.$mid";
import MinionsPage from "./routes/minions.$slug";
import SettingsSlsPage from "./routes/settings-sls";
import SlsEditorPage from "./routes/sls-editor";
import TaskTemplatesPage from "./routes/task-templates";
import TaskPage from "./routes/task.$taskid";
import NotFound from "./shared/components/not-found";

import "@saltbox/saltbox-frontend-common/dist/saltbox-frontend-common.css";

export default observer(function Root() {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback="Loading translations...">
        <BrowserRouter basename="/core">
          <Routes>
            <Route path="/minion/:slug/:mid" element={<MinionPage />} />
            <Route path="/minions/:slug" element={<MinionsPage />} />
            <Route path="/minions" element={<DefaultMinionsPage />} />
            <Route path="/collection/:slug" element={<CollectionEditPage />} />
            <Route path="/master/:mid" element={<MasterPage />} />
            <Route path="/master/:master_id/minion/:minion_id" element={<MinionRedirectPage />} />
            <Route path="/masters" element={<MastersPage />} />
            <Route path="/master/:mid" element={<MasterPage />} />
            <Route path="/job/:jid" element={<JobPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs-templates" element={<JobsTemplatesPage />} />
            <Route path="/task-templates" element={<TaskTemplatesPage />} />
            <Route path="/settings-sls" element={<SettingsSlsPage />} />
            <Route path="/sls-editor" element={<SlsEditorPage />} />
            <Route path="/task/:taskid" element={<TaskPage />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  );
});
