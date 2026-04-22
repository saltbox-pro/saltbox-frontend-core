import { DeleteOutlined } from "@ant-design/icons";
import { PageHeader, FilterToggleButton, useFiltersToggle } from "@saltbox/saltbox-frontend-common";
import { Flex, message, type MenuProps } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { useRemoveMinionConfirm } from "saltbox-core/features/minions/remove-minion";
import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { JobReturnsQueryBuilder } from "saltbox-core/shared/components/minion-details/job-returns-query-builder";
import { MinionDetails } from "saltbox-core/shared/components/minion-details/minion-details";
import { retcodeValues, retcodeLegacyValues } from "saltbox-core/shared/conf/retcode-values";
import { CollectionStore, MinionStore, jobStore, JobFilterStore } from "saltbox-core/store";

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
  const [messageApi, messageContextHolder] = message.useMessage();

  const [collectionStore] = useState(new CollectionStore());
  const minionStoreRef = useRef<MinionStore | undefined>(undefined);
  if (!minionStoreRef.current) {
    minionStoreRef.current = new MinionStore(slug, minionId);
  }
  const minionStore: MinionStore = minionStoreRef.current;
  const { isOpen: shownFilters, toggle: toggleShownFilters } = useFiltersToggle(false);

  const jobReturnsFilterStore = useMemo(() => {
    const storageKey = `jobReturnsFilter:${slug}:${minionId}`;
    return new JobFilterStore(jobReturnsFilterSchema, storageKey);
  }, [slug, minionId]);

  useEffect(() => {
    collectionStore.setCollectionSlug(slug);
  }, [slug]);

  useEffect(() => {
    if (minionStore.error) {
      navigate("/core/not-found");
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

  const removeMinion = useRemoveMinionConfirm({
    collectionSlug: slug ?? "",
    minionMongoId: minionId ?? "",
    minionDisplayId: minionStore.minion?.minion_id,
    messageApi,
    onDeleted: () => {
      navigate(`/core/minions/${slug}`);
    },
  });

  const jobReturnsTabActions = (
    <JobModal
      target={minionStore.minion?.minion_id ?? ""}
      targetType="glob"
      defaultMaster={minionStore.minion?.master ?? ""}
    />
  );

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
      onClick: removeMinion.openConfirm,
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

  const jobReturnsFilterButton = (
    <FilterToggleButton
      isOpen={shownFilters}
      activeFiltersCount={jobReturnsFilterStore.activeFiltersCount}
      onToggle={toggleShownFilters}
    />
  );

  const jobReturnsFilter = shownFilters ? (
    <JobReturnsQueryBuilder
      filterStore={jobReturnsFilterStore}
      jobStore={jobStore}
      onSearchButtonClick={handleJobReturnsFilterSearch}
      onResetButtonClick={handleJobReturnsFilterReset}
    />
  ) : null;

  return (
    <>
      <PageHeader title={`${t("minions.minion")} ${minionStore.minion?.minion_id}`} />

      <MinionDetails
        isFullView
        minion={minionStore.minion}
        isMinionLoading={minionStore.isMinionLoading}
        jobReturnsTabActions={jobReturnsTabActions}
        fullViewActionsMenuItems={minionsActionsMenuItems}
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
      {removeMinion.modalContextHolder}

      {messageContextHolder}
    </>
  );
});

export default MinionPage;
