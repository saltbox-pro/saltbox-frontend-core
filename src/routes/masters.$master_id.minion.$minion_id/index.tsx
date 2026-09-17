import { createLoader, ErrorZone } from "@saltbox/saltbox-frontend-common";
import { Flex, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { apiCoreStore } from "saltbox-core/store/api-core-store";

const MinionRedirectPage = observer(() => {
  const { master_id, minion_id } = useParams();
  const navigate = useNavigate();

  const [minionLoad] = useState(() =>
    createLoader({
      run: (masterId: string | undefined, minionId: string | undefined) =>
        apiCoreStore.minionsApi?.minionGetByMasterAndId({
          master_id: masterId,
          minion_id: minionId,
        }),
      onSuccess: (minion) => {
        navigate(`/core/minions/root/${minion.id}`, { replace: true });
      },
    })
  );

  useEffect(() => {
    minionLoad.run(master_id, minion_id).catch(() => undefined);
  }, [master_id, minion_id]);

  return (
    <ErrorZone level="page" loaders={[minionLoad]} onNavigateHome={() => navigate("/core/minions")}>
      <Flex align={"center"} justify={"center"} style={{ height: "100%" }}>
        <Spin size="large" />
      </Flex>
    </ErrorZone>
  );
});

export default MinionRedirectPage;
