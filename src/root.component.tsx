import { observer } from "mobx-react";
import { BrowserRouter, Routes, Route } from "react-router";
import { I18nextProvider } from "react-i18next";
import { Suspense, useEffect } from "react";
import i18n from "i18next";
import { appStore, envStore, i18nStore } from "saltbox-core/store";
import { autorun, runInAction } from "mobx";
import "react-querybuilder/dist/query-builder.css";
import CollectionPage from "./routes/minions.$slug";
import MastersPage from "./routes/masters";
import JobsPage from "./routes/jobs";
import JobPage from "./routes/job.$jobid";
import JobsTemplatesPage from "./routes/jobs-templates";
import TaskTemplatesPage from "./routes/task-templates";
import SettingsSlsPage from "./routes/settings-sls";
import TaskPage from "./routes/task.$taskid";
import MinionPage from "./routes/minion.$slug.$mid";
import MasterPage from "./routes/master.$mid";

export default observer(function Root(props) {
  useEffect(() => {
    const { authStore, localeStore, env } = props;
    appStore.init(authStore);
    runInAction(() => {
      envStore.env = env;
    });
    autorun(() => {
      i18nStore.currentLanguage = localeStore.currentLocale;
    });
  }, []);

  if (!envStore.env) return <>loading</>;

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback="Loading translations...">
        <BrowserRouter basename="/core">
          <Routes>
            <Route path="/minion/:slug/:mid" element={<MinionPage />} />
            <Route path="/minions/:slug" element={<CollectionPage />} />
            <Route path="/master/:mid" element={<MasterPage />} />
            <Route path="/minion/:slug/:mid" element={<MinionPage />} />
            <Route path="/masters" element={<MastersPage />} />
            <Route path="/master/:mid" element={<MasterPage />} />
            <Route path="/job/:jid" element={<JobPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs-templates" element={<JobsTemplatesPage />} />
            <Route path="/task-templates" element={<TaskTemplatesPage />} />
            <Route path="/settings-sls" element={<SettingsSlsPage />} />
            <Route path="/task/:taskid" element={<TaskPage />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  );
});
