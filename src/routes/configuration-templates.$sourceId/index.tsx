import { createNotFoundError, HttpErrorPage, PageLayout } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

import {
  TemplateSourceDetail,
  TemplateSourceDetailStore,
} from "saltbox-core/features/configuration-templates";

const TemplateSourceDetailPage = observer(function TemplateSourceDetailPage() {
  const { sourceId } = useParams();
  const navigate = useNavigate();

  const store = useMemo(() => {
    if (!sourceId) {
      return null;
    }

    return new TemplateSourceDetailStore(sourceId, () => {
      navigate("/core/configuration-templates");
    });
  }, [navigate, sourceId]);

  useEffect(() => {
    if (!sourceId || !store) {
      return;
    }

    store.load();

    return () => store.reset();
  }, [sourceId, store]);

  if (!sourceId) {
    return <HttpErrorPage error={createNotFoundError()} homePath="/core/configuration-templates" />;
  }

  if (store?.loadError) {
    return (
      <HttpErrorPage
        error={store.loadError}
        homePath="/core/configuration-templates"
        onRetry={() => store.load()}
      />
    );
  }

  return (
    <PageLayout title={store?.source?.name ?? ""}>
      {!!store && <TemplateSourceDetail store={store} />}
    </PageLayout>
  );
});

export default TemplateSourceDetailPage;
