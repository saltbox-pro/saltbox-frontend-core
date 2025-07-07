import { useEffect, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { observer } from "mobx-react-lite"
import { Breadcrumb, Flex, Tabs, Spin, Button, Modal, message, Upload } from "antd"
import { HomeOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons"
import { PageHeader } from "saltbox-core/shared/components/page-header/page-header"
import { FastTablePaginated } from "saltbox-core/shared/components/fast-table-paginated/fast-table-paginated"
import { createColumnHelper } from "@tanstack/react-table"
import { MinionShortSchema, PillarModel, MinionGatherMinionSchema } from "saltbox-core-api"
import { apiStore } from "saltbox-core/store"
import { PillarCreateForm } from "./-components/pillar-create-form"
import { PillarsStore } from "saltbox-core/store"
import { toJS } from "mobx"
import styles from "./index.module.css"

const pillarColumnHelper = createColumnHelper<PillarModel>()
const clientColumnHelper = createColumnHelper<MinionGatherMinionSchema>()

const MasterPage = observer(() => {
  const { t } = useTranslation();
  const { mid: masterId } = useParams();
  const [activeTab, setActiveTab] = useState("clients")
  const [clients, setClients] = useState<MinionGatherMinionSchema[]>([])
  const [pillarsStore] = useState(() => new PillarsStore())
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPillar, setSelectedPillar] = useState<PillarModel | null>(null)
  const isFirstRender = useRef(true)
  const [isClientsLoading, setIsClientsLoading] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importedPillars, setImportedPillars] = useState<PillarModel[]>([])
  const [updateExisting, setUpdateExisting] = useState(false)

  useEffect(() => {
    if (masterId) {
      setIsClientsLoading(true)
      apiStore.minionsApi
        ?.gatherMinionsMinionsGatherGet({
          tgt: "*",
          tgt_type: "glob",
          master: masterId,
        })
        .then((response) => {
          setClients(response?.minions ?? [])
        })
        .catch((error) => {
          setClients([])
        })
        .finally(() => {
          setIsClientsLoading(false)
        })
    }
  }, [masterId])

  useEffect(() => {
    const loadPillars = async () => {
      if (!masterId) return
      try {
        await pillarsStore.loadPillars(masterId)
      } catch (error) {
        if (isFirstRender.current) {
          message.error("Failed to load pillars")
          isFirstRender.current = false;
        }
      }
    }

    loadPillars()
  }, [masterId])

  const handleCreatePillar = async (values: {
    name: string
    value: string
    minionId?: string
  }) => {
    if (!masterId) {
      message.error(t("pillars.select-master-error"))
      return false
    }

    try {
      await pillarsStore.createPillar(
        masterId,
        values.name,
        values.value,
        values.minionId,
      )
      setIsCreateModalOpen(false)
      message.success(t("pillars.create-success"))
      return true
    } catch (error) {
      message.error(t("pillars.create-error"))
      return false
    }
  }

  const handleEditPillar = async (values: {
    name: string
    value: string
    minionId?: string
  }) => {
    if (!masterId || !selectedPillar) {
      message.error(t("pillars.select-master-error"))
      return false
    }

    try {
      await pillarsStore.updatePillar(
        masterId,
        values.name,
        values.value,
        values.minionId,
      )
      setIsEditModalOpen(false)
      message.success(t("pillars.edit-success"))
      return true
    } catch (error) {
      message.error(t("pillars.edit-error"))
      return false
    }
  }

  const handleDeletePillar = async () => {
    if (!masterId || !selectedPillar) {
      message.error(t("pillars.select-master-error"))
      return
    }

    try {
      await pillarsStore.deletePillar(
        masterId,
        selectedPillar.name,
        selectedPillar.minion_id || undefined,
      )
      setIsDeleteModalOpen(false)
      message.success(t("pillars.delete-success"))
    } catch (error) {
      message.error(t("pillars.delete-error"))
    }
  }

  const handleExportCsv = async () => {
    if (!masterId) return

    try {
      const pillars = await apiStore.pillarsApi?.pillarsList({
        master_id: masterId,
      })

      if (!pillars) return

      const escapeCsv = (value: any) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const header = 'target minions,pillar name,pillar value';
      const rows = pillars.map(pillar => [
        escapeCsv(pillar.minion_id || '*'),
        escapeCsv(pillar.name),
        escapeCsv(pillar.value)
      ].join(','));
      const csvContent = [header, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `pillars_${masterId}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      message.error(t("pillars.export-error"))
    }
  }

  const handleImportCsv = async (file: File) => {
    if (!masterId) return

    try {
      const text = await file.text()
      let lines = text.split('\n').filter(line => line.trim())
      if (lines[0].toLowerCase().replace(/\s+/g, '') === 'targetminions,pillarname,pillarvalue') {
        lines[0] = 'minion_id,name,value';
      }
      const dataLines = lines.slice(1);
      const items = dataLines.map(line => {
        const [minion_id, name, value] = line.split(',').map(field => field.trim())
        return {
          master_id: masterId,
          minion_id: minion_id || null,
          name,
          value
        }
      })

      const result = await apiStore.pillarsApi?.pillarImport({
        PillarImportSchema: {
          items,
          update_existing: false
        }
      })

      if (result) {
        message.success(t("pillars.import-success"))
        pillarsStore.loadPillars(masterId)
      }
    } catch (error) {
      message.error(t("pillars.import-parse-error"))
    }
  }

  const handleImportConfirm = async () => {
    if (!masterId) return

    try {
      const invalidPillars = importedPillars.filter(pillar => !pillar.name || !pillar.value)
      if (invalidPillars.length > 0) {
        throw new Error('Invalid pillars data: some pillars are missing required fields')
      }

      console.log('Confirming import with pillars:', importedPillars)
      await apiStore.pillarsApi?.pillarImport({
        PillarImportSchema: {
          items: importedPillars,
          update_existing: updateExisting,
        },
      })
      setIsImportModalOpen(false)
      message.success(t("pillars.import-success"))
      pillarsStore.loadPillars(masterId)
    } catch (error) {
      console.error('Import error:', error)
      message.error(error instanceof Error ? error.message : t("pillars.import-error"))
    }
  }

  const clientColumns = [
    clientColumnHelper.accessor("minion_id", {
      header: t("minions.table-minion-id"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    clientColumnHelper.accessor("master", {
      header: t("minions.table-master"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
  ]

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
              setSelectedPillar(info.row.original)
              setIsEditModalOpen(true)
            }}
            title={t("pillars.table-edit")}
          />
          <Button
            type="default"
            shape="circle"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedPillar(info.row.original)
              setIsDeleteModalOpen(true)
            }}
            title={t("pillars.table-delete")}
          />
        </Flex>
      ),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
  ]

  const importPreviewColumns = [
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
  ]

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
            <FastTablePaginated
              columns={clientColumns}
              data={toJS(clients)}
              total={clients.length}
              pagination={{ pageSize: 10, pageIndex: 0 }}
              getRowId={(row) => row.minion_id}
              onLazyLoad={() => { }}
            />
          )}
        </Flex>
      ),
    },
    {
      key: "pillars",
      label: t("pillars.title"),
      children: (
        <Flex vertical gap="large" className={styles.masterTabs}>
          <Flex gap="small">
            <Upload
              accept=".csv"
              showUploadList={false}
              beforeUpload={(file) => {
                handleImportCsv(file)
                return false
              }}
            >
              <Button icon={<UploadOutlined />}>
                {t("pillars.import")}
              </Button>
            </Upload>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCsv}
            >
              {t("pillars.export")}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t("pillars.create-pillar")}
            </Button>
          </Flex>
          {pillarsStore.isLoading ? (
            <Flex justify="center" align="center" style={{ height: 200 }}>
              <Spin />
            </Flex>
          ) : (
            <FastTablePaginated
              columns={pillarColumns}
              data={toJS(pillarsStore.pillars)}
              total={pillarsStore.pillars.length}
              pagination={{ pageSize: 10, pageIndex: 0 }}
              getRowId={(row) => row.name}
              onLazyLoad={() => { }}
            />
          )}
        </Flex>
      ),
    },
  ]

  return (
    <>
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
          title={t("pillars.edit-pillar-modal-title") + (selectedPillar.name ? `: ${selectedPillar.name}` : "")}
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
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
        okText={t("pillars.form-submit")}
        cancelText={t("pillars.form-cancel")}
        okButtonProps={{ danger: true }}
      >
        <p>
          {t("pillars.modal-delete-confirm-text") + " "}
          <b>{selectedPillar ? selectedPillar.name : ""}</b>?
        </p>
      </Modal>

      <Modal
        title={t("pillars.import")}
        open={isImportModalOpen}
        onOk={handleImportConfirm}
        onCancel={() => setIsImportModalOpen(false)}
        okText={t("pillars.form-submit")}
        cancelText={t("pillars.form-cancel")}
      >
        <Flex vertical gap="middle">
          <p>{t("pillars.import-description", { count: importedPillars.length })}</p>
          <FastTablePaginated
            columns={importPreviewColumns}
            data={importedPillars}
            total={importedPillars.length}
            pagination={{ pageSize: 5, pageIndex: 0 }}
            getRowId={(row) => row.name}
            onLazyLoad={() => { }}
          />
          <Flex align="center" gap="small">
            <input
              type="checkbox"
              id="updateExisting"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
            />
            <label htmlFor="updateExisting">{t("pillars.update-existing")}</label>
          </Flex>
        </Flex>
      </Modal>
    </>
  )
})

export default MasterPage;