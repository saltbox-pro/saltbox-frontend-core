import { observer } from "mobx-react";
import { BrowserRouter, Routes, Route } from "react-router";
import CollectionPage from "./routes/_layout.minions.$slug/index.lazy";
import { I18nextProvider } from "react-i18next";
import { Suspense, useEffect } from "react";
import i18n from "i18next";
import { appStore, envStore } from "saltbox-core/store";
import { runInAction } from "mobx";
import "react-querybuilder/dist/query-builder.css";

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
          </Routes>
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  );
});
