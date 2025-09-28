import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router";
import { observer } from "mobx-react-lite";
import {
  Breadcrumb,
  Flex,
  Tabs,
  Spin,
  Button,
  Modal,
  message,
  Upload,
  Space,
  Input as AntdInput,
  Checkbox,
} from "antd";
import {
  HomeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { createColumnHelper } from "@tanstack/react-table";
import { apiCoreStore } from "saltbox-core/store";
import { PillarCreateForm } from "./-components/pillar-create-form";
import { PillarsStore } from "saltbox-core/store";
import { toJS } from "mobx";
import { PageHeader, FastTableListed } from "@saltbox/saltbox-frontend-common";
import {
  GatheredMinionSchema,
  PillarModel,
  PillarSelector,
  PillarCSVParseResult,
  PillarCSVParseResultErrorCode,
} from "@saltbox/saltbox-core-api-client";

import styles from "./index.module.css";
import { CopyToClipboardButton } from "saltbox-core/shared/components/copy-to-clipboard-button/copy-to-clipboard-button";

const pillarColumnHelper = createColumnHelper<PillarModel>();
const clientColumnHelper = createColumnHelper<GatheredMinionSchema>();

const EditableCell = ({
  value,
  onChange,
  rowIndex,
  fieldName,
}: {
  value: string;
  onChange: (rowIdx: number, dataIndex: string, value: string) => void;
  rowIndex: number;
  fieldName: string;
}) => {
  return (
    <AntdInput.TextArea
      value={value}
      onChange={(e) => onChange(rowIndex, fieldName, e.target.value)}
      className={styles.editableCell}
      autoSize={{ minRows: 1, maxRows: 6 }}
    />
  );
};

const MasterPage = observer(() => {
  const { t } = useTranslation();
  const { mid: masterId } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState<GatheredMinionSchema[]>([]);
  const [pillarsStore] = useState(() => new PillarsStore());
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<PillarModel | null>(
    null
  );
  const isFirstRender = useRef(true);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedPillars, setParsedPillars] = useState<any[]>([]);
  const [isEditingImport, setIsEditingImport] = useState(false);
  const [editedPillars, setEditedPillars] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [isCustomImportModalOpen, setIsCustomImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const PillarsTable = FastTableListed<PillarModel>;

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const translateErrorCode = (
    errorCode: PillarCSVParseResultErrorCode
  ): string => {
    switch (errorCode) {
      case PillarCSVParseResultErrorCode.MinionDoesNotExist:
        return t("pillars.error-minion-does-not-exist");
      case PillarCSVParseResultErrorCode.MasterDoesNotExist:
        return t("pillars.error-master-does-not-exist");
      case PillarCSVParseResultErrorCode.PillarAlreadyExists:
        return t("pillars.error-pillar-already-exists");
      default:
        return errorCode;
    }
  };

  useEffect(() => {
    if (pillarsStore.error) {
      navigate("/not-found");
    }
  }, [pillarsStore.error]);

  useEffect(() => {
    if (masterId) {
      setIsLoadingClients(true);
      apiCoreStore.minionsApi
        ?.minionsGather({
          tgt: "*",
          tgt_type: "glob",
          master: masterId,
        })
        .then((response) => {
          setClients(response?.minions ?? []);
        })
        .catch((error) => {
          setClients([]);
        })
        .finally(() => {
          setIsLoadingClients(false);
        });
    }
  }, [masterId]);

  useEffect(() => {
    const loadPillars = async () => {
      if (!masterId) return;
      try {
        await pillarsStore.loadPillars(masterId);

        const pillars = pillarsStore.pillars;
        const servicePillars = pillars.filter(
          (pillar) => pillar.name === "name" || pillar.name === "value"
        );

        if (servicePillars.length > 0) {
          for (const pillar of servicePillars) {
            try {
              await pillarsStore.deletePillar(
                masterId,
                pillar.name,
                pillar.minion_id || undefined
              );
            } catch (error) {}
          }
          await pillarsStore.loadPillars(masterId);
        }
      } catch (error) {
        if (isFirstRender.current) {
          messageApi.error("Failed to load pillars");
          isFirstRender.current = false;
        }
      }
    };

    loadPillars();
  }, [masterId]);

  const handleCreatePillar = async (values: {
    name: string;
    value: string;
    minionId?: string;
  }) => {
    if (!masterId) {
      messageApi.error(t("pillars.select-master-error"));
      return false;
    }

    try {
      await pillarsStore.createPillar(
        masterId,
        values.name,
        values.value,
        values.minionId
      );
      setIsCreateModalOpen(false);
      messageApi.success(t("pillars.create-success"));
      return true;
    } catch (error) {
      messageApi.error(t("pillars.create-error"));
      return false;
    }
  };

  const handleEditPillar = async (values: {
    name: string;
    value: string;
    minionId?: string;
  }) => {
    if (!masterId || !selectedPillar) {
      messageApi.error(t("pillars.select-master-error"));
      return false;
    }

    try {
      await pillarsStore.updatePillar(
        masterId,
        values.name,
        values.value,
        values.minionId
      );
      setIsEditModalOpen(false);
      messageApi.success(t("pillars.edit-success"));
      return true;
    } catch (error) {
      messageApi.error(t("pillars.edit-error"));
      return false;
    }
  };

  const handleDeletePillar = async () => {
    if (!masterId || !selectedPillar) {
      messageApi.error(t("pillars.select-master-error"));
      return;
    }

    try {
      const pillarSelector: PillarSelector = {
        master_id: masterId,
        name: selectedPillar.name,
        minion_id: selectedPillar.minion_id || null,
      };

      await apiCoreStore.pillarsApi?.pillarDelete({
        PillarSelector: pillarSelector,
      });

      setIsDeleteModalOpen(false);
      messageApi.success(t("pillars.delete-success"));

      await pillarsStore.loadPillars(masterId);
    } catch (error) {
      messageApi.error(t("pillars.delete-error"));
    }
  };

  const handleExportCsv = async () => {
    if (!masterId) return;

    try {
      const pillars = await apiCoreStore.pillarsApi?.pillarsList({
        master_id: masterId,
      });

      if (!pillars) return;

      const escapeCsv = (value: any) => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const header = "target minions,pillar name,pillar value";
      const rows = pillars
        .filter((pillar) => {
          const isServiceRecord =
            pillar.name === "name" || pillar.name === "value";
          return !isServiceRecord;
        })
        .map((pillar) => {
          const row = [
            escapeCsv(pillar.minion_id || "*"),
            escapeCsv(pillar.name),
            escapeCsv(pillar.value),
          ];
          return row.join(",");
        });

      const csvContent = [header, ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `pillars_${masterId}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      messageApi.error(t("pillars.export-error"));
    }
  };

  const handleImportConfirm = async () => {
    if (!masterId) return;
    setIsImporting(true);
    try {
      const sourceData = isEditingImport ? editedPillars : parsedPillars;

      const items = sourceData
        .filter((row: any) => {
          const name = row.name?.trim?.() || "";
          const value = row.value?.trim?.() || "";
          const shouldInclude =
            name && value && name !== "name" && name !== "value";
          return shouldInclude;
        })
        .map((row: any) => ({
          master_id: masterId,
          minion_id: row.minion_id?.trim?.() || null,
          name: row.name?.trim?.() || "",
          value: row.value?.trim?.() || "",
        }));

      const result = await apiCoreStore.pillarsApi?.pillarImport({
        PillarImportSchema: {
          items,
          update_existing: updateExisting,
        },
      });

      if (result) {
        messageApi.success(t("pillars.import-success"));
        setIsCustomImportModalOpen(false);
        setImportFile(null);
        setImportFileList([]);
        setParsedPillars([]);
        setEditedPillars([]);
        setImportStep(1);
        await pillarsStore.loadPillars(masterId);
      }
    } catch (error) {
      messageApi.error(t("pillars.import-parse-error"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenImportModal = () => {
    setIsCustomImportModalOpen(true);
    setImportStep(1);
    setParsedPillars([]);
    setEditedPillars([]);
    setIsEditingImport(false);
    setImportFile(null);
    setUpdateExisting(true);
  };

  const handleImportFileChange = (info: any) => {
    if (info.file.status === "removed") {
      setImportFile(null);
      setImportFileList([]);
      setParsedPillars([]);
      return;
    }
    const fileObj = info.file.originFileObj || info.file;
    setImportFile(fileObj);
    setImportFileList([info.file]);
  };

  const handleParseCsv = async (file?: File) => {
    const fileToParse = file || importFile;
    if (!fileToParse || !masterId) return;
    setIsParsing(true);
    try {
      const text = await fileToParse.text();
      let lines = text.split("\n");
      if (
        lines[0].toLowerCase().replace(/\s+/g, "") ===
        "targetminions,pillarname,pillarvalue"
      ) {
        lines[0] = "minion_id,name,value";
      }
      const fixedText = lines.join("\n");
      const fixedFile = new Blob([fixedText], { type: "text/csv" });

      const response = await apiCoreStore.pillarsApi?.pillarParseCsvRaw({
        master_id: masterId,
        pillars_csv: fixedFile,
      });
      const rawData = await response?.value();

      const correctedData: any[] = [];
      for (let i = 0; i < rawData.length; i += 2) {
        const nameRecord = rawData[i];
        const valueRecord = rawData[i + 1];

        if (
          nameRecord &&
          valueRecord &&
          nameRecord.name === "name" &&
          valueRecord.name === "value"
        ) {
          const allErrorCodes = [
            ...(nameRecord.error_codes || []),
            ...(valueRecord.error_codes || []),
          ];
          const uniqueErrorCodes = [...new Set(allErrorCodes)];

          correctedData.push({
            master_id: nameRecord.master_id,
            minion_id: nameRecord.minion_id,
            name: nameRecord.value,
            value: valueRecord.value,
            error_codes: uniqueErrorCodes,
          });
        }
      }

      setParsedPillars(correctedData);
      setEditedPillars(JSON.parse(JSON.stringify(correctedData)));
      setImportStep(2);
    } catch (e) {
      messageApi.error(t("pillars.import-parse-error"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleEditImport = () => {
    setIsEditingImport(true);
  };

  const handleCancelEditImport = () => {
    setIsEditingImport(false);
    setEditedPillars(JSON.parse(JSON.stringify(parsedPillars)));
  };

  const handleSaveEditImport = async () => {
    if (!masterId) return;

    setIsValidating(true);
    try {
      const pillarsForValidation = editedPillars
        .filter((row: any) => {
          const name = row.name?.trim?.() || "";
          const value = row.value?.trim?.() || "";
          return name && value && name !== "name" && name !== "value";
        })
        .map((row: any) => ({
          master_id: masterId,
          minion_id: row.minion_id?.trim?.() || null,
          name: row.name?.trim?.() || "",
          value: row.value?.trim?.() || "",
        }));

      const validationResults =
        await apiCoreStore.pillarsApi?.pillarImportValidate({
          PillarModel: pillarsForValidation,
        });

      if (validationResults) {
        const validatedData = validationResults.map(
          (result: PillarCSVParseResult) => ({
            master_id: result.master_id,
            minion_id: result.minion_id,
            name: result.name,
            value: result.value,
            error_codes: result.error_codes || [],
          })
        );

        setParsedPillars(validatedData);
        setEditedPillars(JSON.parse(JSON.stringify(validatedData)));
        setIsEditingImport(false);
        messageApi.success(t("pillars.validation-success"));
      }
    } catch (error) {
      messageApi.error(t("pillars.validation-error"));
    } finally {
      setIsValidating(false);
    }
  };

  const handleCellChange = useCallback(
    (rowIdx: number, dataIndex: string, value: string) => {
      setEditedPillars((prev) => {
        if (!prev[rowIdx]) {
          return prev;
        }

        const currentValue = prev[rowIdx][dataIndex];
        if (currentValue === value) {
          return prev;
        }

        const next = [...prev];
        next[rowIdx] = { ...next[rowIdx], [dataIndex]: value };
        return next;
      });
    },
    []
  );

  const clientColumns = [
    clientColumnHelper.accessor("minion_id", {
      header: t("minions.table-minion-id"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
      cell: (data) => {
        return (
          <>
            <Link
              to={`/master/${
                data.row.original.master
              }/minion/${data.getValue()}`}
            >
              <Button type="link" size={"small"}>
                {data.getValue()}
              </Button>
            </Link>
            <CopyToClipboardButton text={data.getValue()} />
          </>
        );
      },
    }),
    clientColumnHelper.accessor("master", {
      header: t("minions.table-master"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
  ];

  const pillarColumns = [
    pillarColumnHelper.accessor("minion_id", {
      header: t("pillars.table-minion-id"),
      cell: (info) => info.getValue() || "*",
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    pillarColumnHelper.accessor("name", {
      header: t("pillars.table-name"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    pillarColumnHelper.accessor("value", {
      header: t("pillars.table-value"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    pillarColumnHelper.display({
      id: "actions",
      header: t("pillars.table-actions"),
      cell: (info) => (
        <Flex gap="small">
          <Button
            type="default"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedPillar(info.row.original);
              setIsEditModalOpen(true);
            }}
            title={t("pillars.table-edit")}
          />
          <Button
            type="default"
            shape="circle"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedPillar(info.row.original);
              setIsDeleteModalOpen(true);
            }}
            title={t("pillars.table-delete")}
          />
        </Flex>
      ),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
  ];

  const importColumns = useMemo(() => {
    return [
      {
        accessorKey: "minion_id",
        header: t("pillars.table-minion-id"),
        cell: ({ row, getValue }: any) => {
          const text = getValue();
          return isEditingImport ? (
            <div key={`minion_id_${row.index}`}>
              <EditableCell
                value={text || ""}
                onChange={handleCellChange}
                rowIndex={row.index}
                fieldName="minion_id"
              />
            </div>
          ) : (
            <div className={styles.tableCell}>{text || "*"}</div>
          );
        },
      },
      {
        accessorKey: "name",
        header: t("pillars.table-name"),
        cell: ({ row, getValue }: any) => {
          const text = getValue();
          return isEditingImport ? (
            <div key={`name_${row.index}`}>
              <EditableCell
                value={text || ""}
                onChange={handleCellChange}
                rowIndex={row.index}
                fieldName="name"
              />
            </div>
          ) : (
            <div className={styles.tableCell}>{text}</div>
          );
        },
      },
      {
        accessorKey: "value",
        header: t("pillars.table-value"),
        cell: ({ row, getValue }: any) => {
          const text = getValue();
          return isEditingImport ? (
            <div key={`value_${row.index}`}>
              <EditableCell
                value={text || ""}
                onChange={handleCellChange}
                rowIndex={row.index}
                fieldName="value"
              />
            </div>
          ) : (
            <div className={styles.tableCell}>{text}</div>
          );
        },
      },
      {
        accessorKey: "error_codes",
        header: t("pillars.table-errors"),
        cell: ({ getValue }: any) => {
          const codes = getValue();
          if (!Array.isArray(codes) || codes.length === 0) {
            return "";
          }
          return (
            <div className={styles.errorCell}>
              {codes.map((code) => translateErrorCode(code)).join(", ")}
            </div>
          );
        },
      },
    ];
  }, [t, isEditingImport, handleCellChange]);

  const tabItems = [
    {
      key: "clients",
      label: t("minions.title"),
      children: (
        <Flex vertical gap="large" className={styles.masterTabs}>
          {isLoadingClients ? (
            <Flex justify="center" align="center" style={{ height: 200 }}>
              <Spin />
            </Flex>
          ) : (
            <div className={styles.clientsTableContainer}>
              <FastTableListed
                columns={clientColumns}
                data={toJS(clients)}
                total={clients.length}
                getRowId={(row) => row.minion_id}
              />
            </div>
          )}
        </Flex>
      ),
    },
    {
      key: "pillars",
      label: t("pillars.title"),
      children: (
        <Flex vertical className={styles.masterTabs}>
          <Flex className="page-actions-buttons">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t("pillars.create-pillar")}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              {t("pillars.export")}
            </Button>
            <Button icon={<UploadOutlined />} onClick={handleOpenImportModal}>
              {t("pillars.import")}
            </Button>
          </Flex>
          {pillarsStore.isLoading ? (
            <Flex justify="center" align="center" style={{ height: 200 }}>
              <Spin />
            </Flex>
          ) : (
            <div className={styles.pillarsTableContainer}>
              <PillarsTable
                key={`pillars-table-${masterId}-${pillarsStore.pillars.length}`}
                columns={pillarColumns}
                data={toJS(pillarsStore.pillars)}
                total={pillarsStore.total}
                isEmpty={!pillarsStore.pillars.length}
                getRowId={(row) => `${row.name}_${row.minion_id || "global"}`}
              />
            </div>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            href: "/masters",
            title: t("masters.title"),
          },
          {
            title: masterId,
          },
        ]}
      />

      <PageHeader title={masterId} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className={styles.masterTabs}
      />

      {isCreateModalOpen && (
        <Modal
          title={t("pillars.create-pillar-modal-title")}
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
          className={styles.modalContainer}
          closable={false}
        >
          <PillarCreateForm
            masterId={masterId || ""}
            onSubmit={handleCreatePillar}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      )}

      {isEditModalOpen && selectedPillar && (
        <Modal
          title={
            t("pillars.edit-pillar-modal-title") +
            (selectedPillar.name
              ? `: ${truncateText(selectedPillar.name)}`
              : "")
          }
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
          className={styles.modalContainer}
          closable={false}
        >
          <PillarCreateForm
            masterId={masterId || ""}
            onSubmit={handleEditPillar}
            onCancel={() => setIsEditModalOpen(false)}
            initialValues={{
              name: selectedPillar.name,
              value: selectedPillar.value,
              minionId: selectedPillar.minion_id || undefined,
            }}
            onlyValueField={true}
          />
        </Modal>
      )}

      <Modal
        title={t("pillars.delete-pillar-modal-title")}
        open={isDeleteModalOpen}
        onOk={handleDeletePillar}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText={t("pillars.delete")}
        cancelText={t("pillars.form-cancel")}
        okButtonProps={{ danger: true }}
        className={styles.modalContainer}
        closable={false}
      >
        <p>
          {t("pillars.modal-delete-confirm-text") + " "}
          <b>{selectedPillar ? truncateText(selectedPillar.name) : ""}</b>?
        </p>
        {selectedPillar && (
          <p className={styles.deleteInfo}>
            Master: {selectedPillar.master_id}, Minion:{" "}
            {selectedPillar.minion_id || "global"}
          </p>
        )}
      </Modal>

      <Modal
        title={t("pillars.import")}
        open={isCustomImportModalOpen}
        onCancel={() => {
          setIsCustomImportModalOpen(false);
          setImportFile(null);
          setImportFileList([]);
        }}
        footer={
          importStep === 1 ? (
            <div className={styles.importFooter}>
              <Button
                type="primary"
                onClick={() => handleParseCsv(importFile || undefined)}
                disabled={!importFile}
                loading={isParsing}
              >
                {t("pillars.next")}
              </Button>
            </div>
          ) : null
        }
        width={1000}
        className={styles.modalContainer}
      >
        {importStep === 1 && (
          <Space direction="vertical" className={styles.importSpace}>
            <Upload.Dragger
              accept=".csv"
              beforeUpload={() => false}
              fileList={importFileList}
              onChange={handleImportFileChange}
              onRemove={() => {
                setImportFile(null);
                setImportFileList([]);
              }}
              multiple={false}
              showUploadList={{ showRemoveIcon: true }}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p>{t("pillars.import-description")}</p>
              <p className={styles.importDescription}>
                {t("pillars.import-single-upload")}
              </p>
            </Upload.Dragger>
          </Space>
        )}
        {importStep === 2 && (
          <>
            <div className={styles.importControls}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                >
                  {t("pillars.import-update-existing")}
                </Checkbox>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Button
                  type="primary"
                  onClick={handleImportConfirm}
                  loading={isImporting}
                  disabled={
                    !(isEditingImport
                      ? editedPillars.length
                      : parsedPillars.length)
                  }
                >
                  {t("pillars.import")}
                </Button>
                {!isEditingImport ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={handleEditImport}
                  />
                ) : (
                  <Flex gap={8}>
                    <Button
                      type="link"
                      size="small"
                      icon={<SaveOutlined />}
                      onClick={handleSaveEditImport}
                      loading={isValidating}
                    />
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={handleCancelEditImport}
                    />
                  </Flex>
                )}
              </div>
            </div>
            <div className={styles.importTableContainer}>
              <FastTableListed
                key={`import-table-${isEditingImport ? "editing" : "viewing"}`}
                columns={importColumns}
                data={isEditingImport ? editedPillars : parsedPillars}
                getRowId={(row, idx) => String(idx)}
              />
            </div>
          </>
        )}
      </Modal>
    </>
  );
});

export default MasterPage;
