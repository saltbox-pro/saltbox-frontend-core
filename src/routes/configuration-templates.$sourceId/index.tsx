import { PageLayout } from "@saltbox/saltbox-frontend-common";
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
    if (!sourceId) {
      navigate("/core/not-found");
      return;
    }

    if (!store) return;

    store.load();

    return () => store.reset();
  }, [navigate, sourceId, store]);

  useEffect(() => {
    if (store?.notFound) {
      navigate("/core/not-found");
    }
  }, [navigate, store?.notFound]);

  return (
    <PageLayout title={store?.source?.name ?? ""}>
      {!!store && <TemplateSourceDetail store={store} />}
    </PageLayout>
  );
});

export default TemplateSourceDetailPage;
