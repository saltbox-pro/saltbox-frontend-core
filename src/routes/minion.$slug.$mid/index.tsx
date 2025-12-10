import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Flex, message } from "antd";
import { HomeOutlined, DeleteOutlined, PlusOutlined, FilterOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { formatQuery } from "react-querybuilder";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { JobReturnsQueryBuilder } from "saltbox-core/shared/components/minion-details/job-returns-query-builder";
import { PageHeader, Modal } from "@saltbox/saltbox-frontend-common";
import { CollectionStore, MinionStore, jobStore, JobFilterStore } from "saltbox-core/store";
import { apiCoreStore } from "saltbox-core/store/api-core-store";
import { PillarCreateForm } from "./-components/pillar-create-form";

const jobReturnsFilterSchema = [
  {
    name: "jid",
    label: "JID",
  },
  {
    name: "fun",
    label: "Function",
  },
  {
    name: "retcode",
    label: "Return Code",
    inputType: "number",
  },
  {
    name: "stamp",
    label: "Timestamp",
    inputType: "datetime-local",
    valueEditorType: "datetime-local",
  },
];

const MinionPage = observer(() => {
  const { t } = useTranslation();
  const { mid: minionId, slug } = useParams();
  const navigate = useNavigate();
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

    const filterQuery = jobReturnsFilterStore.searchMongoDBQuery;
    const hasFilters = filterQuery && Object.keys(filterQuery).length > 0;

    jobStore.reset();
    jobStore.mongoDBQuery = hasFilters
      ? { ...baseQuery, ...filterQuery }
      : baseQuery;
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

    const filterQuery = jobReturnsFilterStore.searchMongoDBQuery;
    const hasFilters = filterQuery && Object.keys(filterQuery).length > 0;

    jobStore.mongoDBQuery = hasFilters
      ? { ...baseQuery, ...filterQuery }
      : baseQuery;
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
      variant={
        showJobReturnsFilter
          ? "solid"
          : hasJobReturnsFilters
            ? "filled"
            : "outlined"
      }
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
      onSearchButtonClick={handleJobReturnsFilterSearch}
      onResetButtonClick={handleJobReturnsFilterReset}
    />
  ) : null;

  return (
    <>
      <Breadcrumb
        items={[
          {
            title: <Link to="/minions"><HomeOutlined /></Link>,
          },
          {
            title: t("minions.title"),
          },
          {
            title: <Link to={`/minions/${slug}`}>{collectionStore.collection?.title ?? ""}</Link>,
          },
          {
            title: `${t("minions.minion")} ${minionStore.minion?.minion_id}`,
          },
        ]}
      />
      <PageHeader
        title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`}
      />

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
    </>
  );
});

export default MinionPage;
