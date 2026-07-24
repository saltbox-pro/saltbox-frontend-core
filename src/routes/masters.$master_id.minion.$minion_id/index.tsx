import {
  createResourceLoadError,
  HttpErrorPage,
  type ResourceLoadError,
} from "@saltbox/saltbox-frontend-common";
import { Flex, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { apiCoreStore } from "saltbox-core/store/api-core-store";

const MinionRedirectPage = observer(() => {
  const { master_id, minion_id } = useParams();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState<ResourceLoadError | null>(null);

  const loadMinionRedirect = () => {
    setLoadError(null);
    apiCoreStore.minionsApi
      ?.minionGetByMasterAndId({
        master_id: master_id,
        minion_id: minion_id,
      })
      .then((minion) => {
        navigate(`/core/minions/root/${minion.id}`, { replace: true });
      })
      .catch((error) => {
        console.error("Error fetching minion:", error);
        setLoadError(createResourceLoadError(error));
      });
  };

  useEffect(() => {
    loadMinionRedirect();
  }, []);

  if (loadError) {
    return (
      <HttpErrorPage error={loadError} homePath="/core/minions" onRetry={loadMinionRedirect} />
    );
  }

  return (
    <Flex align={"center"} justify={"center"} style={{ height: "100%" }}>
      <Spin size="large" />
    </Flex>
  );
});

export default MinionRedirectPage;
