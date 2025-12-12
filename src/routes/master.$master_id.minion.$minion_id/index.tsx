import { Flex, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { apiCoreStore } from "saltbox-core/store/api-core-store";

const MinionRedirectPage = observer(() => {
  const { master_id, minion_id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    apiCoreStore.minionsApi
      ?.minionGetByMasterAndId({
        master_id: master_id,
        minion_id: minion_id,
      })
      .then((minion) => {
        navigate(`/minion/root/${minion.id}`, { replace: true });
      })
      .catch((error) => {
        console.error("Error fetching minion:", error);
        navigate("/not-found");
      });
  }, []);

  return (
    <Flex align={"center"} justify={"center"} style={{ height: "100%" }}>
      <Spin size="large" />
    </Flex>
  );
});

export default MinionRedirectPage;
