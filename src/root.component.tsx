import { observer } from "mobx-react";
import { BrowserRouter, Routes, Route } from "react-router";
import CollectionPage from "./routes/_layout.minions.$slug/index.lazy";
import { I18nextProvider } from "react-i18next";
import { Suspense } from "react";
import i18n from "i18next";
import { appStore } from "saltbox-core/store";

export default observer(function Root(props) {
  const { authStore } = props;
  appStore.init(authStore);

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
