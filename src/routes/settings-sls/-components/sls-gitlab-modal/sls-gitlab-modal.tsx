import { GitlabProjectSchema, SettingsSlsRepoCreateSchema } from "@saltbox/saltbox-core-api-client";
import { Flex, Spin, Card, Button, Typography, Space, Popover } from "antd";
import { ClockCircleOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import { Modal, pastTimeByUserTZ, formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";
import { apiCoreStore } from "saltbox-core/store";

import styles from "./sls-gitlab-modal.module.css";

const { Text, Link } = Typography;

type SlsGitLabModalProps = {
  isOpen: boolean;
  onClose: (request?: SettingsSlsRepoCreateSchema) => void;
};

type ContentModal = {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
} | null;

export function SlsGitLabModal(props: SlsGitLabModalProps) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<GitlabProjectSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentModal, setContentModal] = useState<ContentModal>(null);

  useEffect(() => {
    setIsLoading(true);
    apiCoreStore.gitLabApi.projectList({
    }).then(({ items: projects }) => {
      setProjects(projects);
      apiCoreStore.settingsApi.repoList({}).then(({ data: slsRepos }) => {
        const projectsWithoutSlsRepos = projects.filter((project) => !slsRepos.some((slsRepo) => slsRepo.repo_url === project.http_url_to_repo));
        setProjects(projectsWithoutSlsRepos);
      }).finally(() => {
        setIsLoading(false);
      });
    }).catch(() => {
      setIsLoading(false);
    });
  }, [props.isOpen]);

  const handleModalCancel = () => {
    props.onClose();
  };

  const handleLoadRepository = (project?: GitlabProjectSchema) => {
    if (project) {
      props.onClose({
        name: project.name,
        description: project.description,
        repo_url: project.http_url_to_repo,
        repo_user: "",
        repo_pass: "",
      });
    }
    props.onClose();
  };

  const handleShowReadme = (project: GitlabProjectSchema) => {
    setContentModal({
      isOpen: true,
      title: `README - ${project.name}`,
      content: "",
      isLoading: true,
    });

    apiCoreStore.gitLabApi.projectReadme({ project_id: project.id }).then(async (response) => {
      setContentModal({
        isOpen: true,
        title: `README - ${project.name}`,
        content: (response?.content || t("sls-gitlab-modal.no-content")) as string,
        isLoading: false,
      });
    }).catch(() => {
      setContentModal({
        isOpen: true,
        title: `README - ${project.name}`,
        content: t("sls-gitlab-modal.error-loading"),
        isLoading: false,
      });
    });
  };

  const handleShowManifest = async (project: GitlabProjectSchema) => {
    setContentModal({
      isOpen: true,
      title: `Manifest - ${project.name}`,
      content: "",
      isLoading: true,
    });

    apiCoreStore.gitLabApi.projectManifest({ project_id: project.id }).then(async (response) => {
      setContentModal({
        isOpen: true,
        title: `Manifest - ${project.name}`,
        content: (response?.content || t("sls-gitlab-modal.no-content")) as string,
        isLoading: false,
      });
    }).catch(() => {
      setContentModal({
        isOpen: true,
        title: `Manifest - ${project.name}`,
        content: t("sls-gitlab-modal.error-loading"),
        isLoading: false,
      });
    });
  };

  const handleCloseContentModal = () => {
    setContentModal(null);
  };

  return (
    <>
      <Modal
        title={t("sls-gitlab-modal.modal-title")}
        open={props.isOpen}
        onCancel={handleModalCancel}
        width={"50%"}
        height={"80vh"}
        footer={""}
      >
        {isLoading &&
          <Flex justify="center" align="center" style={{ height: "10rem" }}>
            <Spin spinning={true} />
          </Flex>
        }

        {!isLoading && projects.length === 0 && (
          <Flex justify="center" align="center" style={{ height: "10rem" }}>
            <Text>{t("sls-gitlab-modal.empty-state")}</Text>
          </Flex>
        )}

        {!isLoading && projects.length > 0 && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {projects.map((project) => (
              <Card
                key={project.id}
                title={<Text strong>{project.name}</Text>}
                size="small"
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    title={t("sls-gitlab-modal.load-button-text")}
                    onClick={() => handleLoadRepository(project)}
                  >
                    {t("sls-gitlab-modal.load-button-text")}
                  </Button>
                }
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {project.description && (
                    <div>
                      <Text type="secondary">{t("sls-gitlab-modal.description")}: </Text>
                      <Text>{project.description}</Text>
                    </div>
                  )}

                  <div>
                    <Text type="secondary">{t("sls-gitlab-modal.full-name")}: </Text>
                    <Text>{project.name_with_namespace}</Text>
                  </div>

                  <div>
                    <Text type="secondary">{t("sls-gitlab-modal.path")}: </Text>
                    <Text code>{project.path}</Text>
                  </div>

                  <div>
                    <Text type="secondary">{t("sls-gitlab-modal.url")}: </Text>
                    <Link href={project.web_url} target="_blank" rel="noopener noreferrer">
                      {project.web_url}
                    </Link>
                  </div>

                  <Flex gap="middle" wrap="wrap">
                    {project.created_at && (
                      <Flex gap="small">
                        <Text type="secondary">
                          <ClockCircleOutlined className={styles.dateTimeIcon} />
                          {t("sls-gitlab-modal.created")}:
                        </Text>
                        <Popover content={formatTimeByUserTZ(project.created_at)}>
                          <Text style={{ cursor: 'pointer' }}>{pastTimeByUserTZ(project.created_at)}</Text>
                        </Popover>
                      </Flex>
                    )}

                    {project.last_activity_at && (
                      <Flex gap="small">
                        <Text type="secondary">
                          <ClockCircleOutlined className={styles.dateTimeIcon} />
                          {t("sls-gitlab-modal.last-activity")}:
                        </Text>
                        <Popover content={formatTimeByUserTZ(project.last_activity_at)}>
                          <Text style={{ cursor: 'pointer' }}>{pastTimeByUserTZ(project.last_activity_at)}</Text>
                        </Popover>
                      </Flex>
                    )}

                    {project.updated_at && (
                      <Flex gap="small">
                        <Text type="secondary">
                          <ClockCircleOutlined className={styles.dateTimeIcon} />
                          {t("sls-gitlab-modal.updated")}:
                        </Text>
                        <Popover content={formatTimeByUserTZ(project.updated_at)}>
                          <Text style={{ cursor: 'pointer' }}>{pastTimeByUserTZ(project.updated_at)}</Text>
                        </Popover>
                      </Flex>
                    )}
                  </Flex>

                  <Flex gap="middle" wrap="wrap">
                    <Link onClick={() => handleShowReadme(project)}>
                      <FileTextOutlined className={styles.fileIcon} />
                      README
                    </Link>

                    <Link onClick={() => handleShowManifest(project)}>
                      <FileTextOutlined className={styles.fileIcon} />
                      Manifest
                    </Link>
                  </Flex>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Modal>

      {contentModal && (
        <Modal
          title={contentModal.title}
          open={contentModal.isOpen}
          onCancel={handleCloseContentModal}
          width={"50%"}
          footer={null}
        >
          {contentModal.isLoading ? (
            <Flex justify="center" align="center" style={{ height: "10rem" }}>
              <Spin spinning={true} />
            </Flex>
          ) : (
            <div className={styles.markdownContent}>
              <Markdown >{contentModal.content}</Markdown>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
