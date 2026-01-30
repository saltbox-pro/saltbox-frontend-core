import { DeleteOutlined, PlusOutlined, FilterOutlined } from "@ant-design/icons";
import { PageHeader, Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, message, type MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatQuery } from "react-querybuilder";
import { useLocation, useNavigate, useParams } from "react-router";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { JobReturnsQueryBuilder } from "saltbox-core/shared/components/minion-details/job-returns-query-builder";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { retcodeValues, retcodeLegacyValues } from "saltbox-core/shared/conf/retcode-values";
import { CollectionStore, MinionStore, jobStore, JobFilterStore } from "saltbox-core/store";
import { apiCoreStore } from "saltbox-core/store/api-core-store";

import { PillarCreateForm } from "./-components/pillar-create-form";

const defaultStringOperators = [
  {
    name: "=",
    value: "=",
    label: "=",
  },
  {
    name: "!=",
    value: "!=",
    label: "!=",
  },
  {
    name: "contains",
    value: "contains",
    label: "contains",
  },
  {
    name: "beginsWith",
    value: "beginsWith",
    label: "begins with",
  },
  {
    name: "endsWith",
    value: "endsWith",
    label: "ends with",
  },
  {
    name: "doesNotContain",
    value: "doesNotContain",
    label: "does not contain",
  },
  {
    name: "doesNotBeginWith",
    value: "doesNotBeginWith",
    label: "does not begin with",
  },
  {
    name: "doesNotEndWith",
    value: "doesNotEndWith",
    label: "does not end with",
  },
];

const defaultDateTimeOperators = [
  {
    name: "<",
    value: "<",
    label: "<",
  },
  {
    name: ">",
    value: ">",
    label: ">",
  },
  {
    name: "<=",
    value: "<=",
    label: "<=",
  },
  {
    name: ">=",
    value: ">=",
    label: ">=",
  },
];

type MongoDBQuery = Record<string, unknown> & {
  retcode?: { $in?: Array<number | string> } | number | string | { $ne: number };
  $and?: Array<MongoDBQuery>;
  $or?: Array<MongoDBQuery>;
};

const transformRetcodeValue = (retcode: unknown): number | { $ne: number } | undefined => {
  if (
    typeof retcode === "object" &&
    retcode !== null &&
    "$in" in retcode &&
    Array.isArray(retcode.$in)
  ) {
    const retcodeIn = retcode.$in;
    const hasYes =
      retcodeIn.includes(retcodeLegacyValues.zero) ||
      retcodeIn.some((v) => String(v).toLowerCase() === retcodeValues.yes.toLowerCase());
    const hasNo =
      retcodeIn.includes(retcodeLegacyValues.notSuccess) ||
      retcodeIn.some((v) => String(v).toLowerCase() === retcodeValues.no.toLowerCase());

    if (hasYes === hasNo) return undefined;
    return hasNo ? { $ne: 0 } : 0;
  }

  const retcodeStr = String(retcode).toLowerCase();
  const isNo =
    retcodeStr === retcodeValues.no.toLowerCase() || retcode === retcodeLegacyValues.notSuccess;
  const isYes =
    retcodeStr === retcodeValues.yes.toLowerCase() ||
    retcode === retcodeLegacyValues.zero ||
    Number(retcode) === 0;

  if (isNo) return { $ne: 0 };
  if (isYes) return 0;
  return undefined;
};

const transformRetcodeFilter = (query: object): MongoDBQuery => {
  const mongoQuery = query as MongoDBQuery;
  const result: MongoDBQuery = {};

  if (mongoQuery?.retcode) {
    const transformedRetcode = transformRetcodeValue(mongoQuery.retcode);
    if (transformedRetcode !== undefined) {
      result.retcode = transformedRetcode;
    }
  }

  if (Array.isArray(mongoQuery.$and)) {
    const transformedAnd = mongoQuery.$and
      .map(transformRetcodeFilter)
      .filter((item) => Object.keys(item).length > 0);
    if (transformedAnd.length > 0) result.$and = transformedAnd;
  }

  if (Array.isArray(mongoQuery.$or)) {
    const transformedOr = mongoQuery.$or
      .map(transformRetcodeFilter)
      .filter((item) => Object.keys(item).length > 0);
    if (transformedOr.length > 0) result.$or = transformedOr;
  }

  Object.keys(mongoQuery).forEach((key) => {
    if (key !== "retcode" && key !== "$and" && key !== "$or") {
      result[key] = mongoQuery[key];
    }
  });

  return result;
};

const retcodeOperators = [
  {
    name: "=",
    value: "=",
    label: "=",
  },
];

const jobReturnsFilterSchema = [
  {
    name: "jid",
    label: "JID",
    operators: defaultStringOperators,
  },
  {
    name: "fun",
    label: "Function",
    operators: defaultStringOperators,
  },
  {
    name: "retcode",
    label: "Return Code",
    operators: retcodeOperators,
  },
  {
    name: "stamp",
    label: "Timestamp",
    operators: defaultDateTimeOperators,
    inputType: "datetime-local",
    valueEditorType: "datetime-local",
  },
];

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const minionStoreRef = useRef<MinionStore | undefined>(undefined);
  if (!minionStoreRef.current) {
    minionStoreRef.current = new MinionStore(slug, minionId);
  }
  const minionStore: MinionStore = minionStoreRef.current;
  const [collectionStore] = useState(new CollectionStore());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showJobReturnsFilter, setShowJobReturnsFilter] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const jobReturnsFilterStore = useMemo(() => new JobFilterStore(jobReturnsFilterSchema), []);

  useEffect(() => {
    collectionStore.setCollectionSlug(slug);
  }, [slug]);

  useEffect(() => {
    if (minionStore.error) {
      navigate("/not-found");
    }
  }, [minionStore.error]);

  useEffect(() => {
    const minionId = minionStore.minion?.minion_id;
    const masterId = minionStore.minion?.master;

    if (!minionId || !masterId || !slug) {
      jobStore.reset();
      return;
    }

    const baseQuery = {
      minion_id: minionId,
      salt_master: masterId,
    };

    let filterQuery = transformRetcodeFilter(jobReturnsFilterStore.searchMongoDBQuery);
    const hasFilters = filterQuery && Object.keys(filterQuery).length > 0;

    jobStore.reset();
    jobStore.mongoDBQuery = hasFilters ? { ...baseQuery, ...filterQuery } : baseQuery;
    jobStore.loadJobReturns();
  }, [minionStore.minion?.minion_id, minionStore.minion?.master, slug, jobReturnsFilterStore]);

  const handleDeleteMinion = useCallback(async () => {
    if (!minionId || !slug) return;

    try {
      await apiCoreStore.minionsApi?.minionDelete({
        mid: minionId,
        collection_slug: slug,
      });
      // using `message` instead of `messageApi` here to show the feedback even when the page is changed
      message.success(t("minions.deleted-successfully"));
      setIsDeleteModalOpen(false);
      navigate(`/minions/${slug}`);
    } catch (error) {
      messageApi.error(t("minions.delete-failed"));
      console.error("Failed to delete minion:", error);
    }
  }, [minionId, slug, messageApi, t, navigate]);

  const handleCreatePillar = useCallback(
    async (values: { name: string; value: string }) => {
      if (!minionStore.minion?.master || !minionStore.minion?.minion_id) {
        messageApi.error(t("pillars.select-master-error"));
        return false;
      }

      try {
        await apiCoreStore.pillarsApi?.pillarCreate({
          PillarModel: {
            master_id: minionStore.minion.master,
            minion_id: minionStore.minion.minion_id,
            name: values.name,
            value: values.value,
          },
        });
        setIsCreateModalOpen(false);
        messageApi.success(t("pillars.create-success"));
        minionStore.loadPillars();
        return true;
      } catch (error) {
        messageApi.error(t("pillars.create-error"));
        return false;
      }
    },
    [minionStore, messageApi, t]
  );

  const pillarsTabActions = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => setIsCreateModalOpen(true)}
      disabled={!minionStore.minion}
    >
      {t("pillars.create-pillar")}
    </Button>
  );

  const jobReturnsTabActions = (
    <JobModal
      target={minionStore.minion?.minion_id ?? ""}
      targetType="glob"
      defaultMaster={minionStore.minion?.master ?? ""}
    />
  );

  const handleFullViewActionsMenuClick: MenuProps["onClick"] = (info) => {
    if (info.key === "delete-minion") {
      setIsDeleteModalOpen(true);
    }
  };

  const minionsActionsMenuItems: MenuProps["items"] = [
    {
      key: "delete-minion",
      label: (
        <Flex align="center" gap={8}>
          <DeleteOutlined />
          {t("minions.delete")}
        </Flex>
      ),
      danger: true,
      disabled: !minionStore.minion,
    },
  ];

  const handleJobReturnsFilterSearch = useCallback(() => {
    const minionId = minionStore.minion?.minion_id;
    const masterId = minionStore.minion?.master;

    if (!minionId || !masterId) {
      return;
    }

    const baseQuery = {
      minion_id: minionId,
      salt_master: masterId,
    };

    let filterQuery = transformRetcodeFilter(jobReturnsFilterStore.searchMongoDBQuery);
    const hasFilters = filterQuery && Object.keys(filterQuery).length > 0;

    jobStore.mongoDBQuery = hasFilters ? { ...baseQuery, ...filterQuery } : baseQuery;
    jobStore.pagination.pageIndex = 0;
    jobStore.loadJobReturns();
  }, [minionStore.minion?.minion_id, minionStore.minion?.master, jobReturnsFilterStore]);

  const handleJobReturnsFilterReset = useCallback(() => {
    jobReturnsFilterStore.handleResetFilters();
    handleJobReturnsFilterSearch();
  }, [jobReturnsFilterStore, handleJobReturnsFilterSearch]);

  const hasJobReturnsFilters = useMemo(() => {
    return (
      formatQuery(jobReturnsFilterStore.searchFilters, "json_without_ids") !==
      formatQuery({ rules: [], combinator: "and", not: false }, "json_without_ids")
    );
  }, [jobReturnsFilterStore.searchFilters]);

  const jobReturnsFilterButton = (
    <Button
      onClick={() => setShowJobReturnsFilter(!showJobReturnsFilter)}
      color={"primary"}
      variant={showJobReturnsFilter ? "solid" : hasJobReturnsFilters ? "filled" : "outlined"}
    >
      <Flex gap={8}>
        <FilterOutlined />
        {t("minions.filters-button")}
      </Flex>
    </Button>
  );

  const jobReturnsFilter = showJobReturnsFilter ? (
    <JobReturnsQueryBuilder
      filterStore={jobReturnsFilterStore}
      jobStore={jobStore}
      onSearchButtonClick={handleJobReturnsFilterSearch}
      onResetButtonClick={handleJobReturnsFilterReset}
    />
  ) : null;

  return (
    <div key={location.key}>
      <PageHeader title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`} />

      <MinionDetails
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        pillars={minionStore.pillars}
        isPillarsLoading={minionStore.isPillarsLoading}
        isFullView
        pillarsTabActions={pillarsTabActions}
        jobReturnsTabActions={jobReturnsTabActions}
        fullViewActionsMenuItems={minionsActionsMenuItems}
        onFullViewActionsMenuClick={handleFullViewActionsMenuClick}
        jobReturnsConfig={
          jobStore
            ? {
                jobReturns: jobStore.jobReturns,
                isLoading: jobStore.isJobReturnsLoading,
                pagination: jobStore.pagination,
                sorting: jobStore.sorting,
                total: jobStore.total,
                onLazyLoad: jobStore.handleLazyLoad,
              }
            : undefined
        }
        jobReturnsFilter={jobReturnsFilter}
        jobReturnsFilterButton={jobReturnsFilterButton}
      />

      <Modal
        title={t("minions.delete-confirm-title")}
        open={isDeleteModalOpen}
        onOk={handleDeleteMinion}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText={t("common.yes")}
        cancelText={t("common.cancel")}
        okButtonProps={{ danger: true }}
      >
        <p
          dangerouslySetInnerHTML={{
            __html: t("minions.delete-confirm-description", {
              minionId: minionStore.minion?.minion_id,
            }),
          }}
        />
      </Modal>

      {isCreateModalOpen && (
        <Modal
          title={t("pillars.create-pillar-modal-title")}
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          closable={false}
        >
          <PillarCreateForm
            onSubmit={handleCreatePillar}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      )}

      {contextHolder}
    </div>
  );
});

export default MinionPage;
