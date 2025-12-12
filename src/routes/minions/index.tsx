import { Flex, Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { CollectionStore } from "saltbox-core/store";

const DefaultMinionsPage = observer(() => {
  const [collectionStore] = useState(new CollectionStore());
  const navigate = useNavigate();
  useEffect(() => {
    collectionStore.setCollectionSlug("default");
  }, []);
  useEffect(() => {
    if (collectionStore.collection) navigate(`/minions/${collectionStore.collection.slug}`);
  }, [collectionStore.collection]);
  return (
    <Flex align={"center"} justify={"center"} style={{ height: "100%" }}>
      <Spin></Spin>
    </Flex>
  );
});

export default DefaultMinionsPage;
