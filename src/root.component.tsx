import { observer } from "mobx-react";
import { BrowserRouter, Routes, Route } from "react-router";
import { I18nextProvider } from "react-i18next";
import { Suspense, useEffect } from "react";
import i18n from "i18next";
import { appStore, envStore } from "saltbox-core/store";
import { runInAction } from "mobx";
import "react-querybuilder/dist/query-builder.css";
import CollectionPage from "./routes/_layout.minions.$slug/index.lazy";
import MastersPage from "./routes/_layout.masters/index.lazy";
import JobsPage from "./routes/_layout.jobs/index.lazy";
import JobPage from "./routes/_layout.job.$jobid/index.lazy";
import JobsTemplatesPage from "./routes/_layout.jobs-templates/index.lazy";
import TaskTemplatesPage from "./routes/_layout.task-templates/index.lazy";
import SettingsSlsPage from "./routes/_layout.settings-sls/index.lazy";

export default observer(function Root(props) {
  useEffect(() => {
    const { authStore, env } = props;
    appStore.init(authStore);
    runInAction(() => {
      envStore.env = env;
    });
  }, []);

  if (!envStore.env) return <>loading</>;

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback="Loading translations...">
        <BrowserRouter basename="/core">
          <Routes>
            <Route path="/minions/:slug" element={<CollectionPage />} />
            <Route path="/masters" element={<MastersPage />} />
            <Route path="/job/:jid" element={<JobPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs-templates" element={<JobsTemplatesPage />} />
            <Route path="/task-templates" element={<TaskTemplatesPage />} />
            <Route path="/settings-sls" element={<SettingsSlsPage />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  );
});
