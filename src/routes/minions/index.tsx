import { observer } from "mobx-react-lite";
import { Flex, Spin } from "antd";
import { useEffect, useState } from "react";
import { CollectionStore } from "saltbox-core/store";
import { useNavigate } from "react-router";

const DefaultMinionsPage = observer(() => {
  const [collectionStore] = useState(new CollectionStore());
  const navigate = useNavigate();
  useEffect(() => {
    collectionStore.setCollectionSlug("default");
  }, []);
  useEffect(() => {
    if (collectionStore.collection)
      navigate(`/minions/${collectionStore.collection.slug}`);
  }, [collectionStore.collection]);
  return (
    <Flex align={"center"} justify={"center"} style={{ height: "100%" }}>
      <Spin></Spin>
    </Flex>
  );
});

export default DefaultMinionsPage;
