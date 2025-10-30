import { GitlabProjectSchema, SettingsSlsRepoCreateSchema } from "@saltbox/saltbox-core-api-client";
import { Flex, Spin, Card, Button, Typography, Space, Popover } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Modal, pastTimeByUserTZ, formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiCoreStore } from "saltbox-core/store";

const { Text, Link } = Typography;

interface SlsGitLabModalProps {
  isOpen: boolean;
  onClose: (request?: SettingsSlsRepoCreateSchema) => void;
}

export function SlsGitLabModal(props: SlsGitLabModalProps) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<GitlabProjectSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiCoreStore.gitLabApi.projectList({
    }).then((response) => {
      setProjects(response.items);
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

  return (
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

      {!isLoading &&
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
                    <div>
                      <Text type="secondary">{t("sls-gitlab-modal.created")}: </Text>
                      <Popover content={formatTimeByUserTZ(project.created_at)}>
                        <Text style={{ cursor: 'pointer' }}>{pastTimeByUserTZ(project.created_at)}</Text>
                      </Popover>
                    </div>
                  )}

                  {project.last_activity_at && (
                    <div>
                      <Text type="secondary">{t("sls-gitlab-modal.last-activity")}: </Text>
                      <Popover content={formatTimeByUserTZ(project.last_activity_at)}>
                        <Text style={{ cursor: 'pointer' }}>{pastTimeByUserTZ(project.last_activity_at)}</Text>
                      </Popover>
                    </div>
                  )}

                  {project.updated_at && (
                    <div>
                      <Text type="secondary">{t("sls-gitlab-modal.updated")}: </Text>
                      <Popover content={formatTimeByUserTZ(project.updated_at)}>
                        <Text style={{ cursor: 'pointer' }}>{pastTimeByUserTZ(project.updated_at)}</Text>
                      </Popover>
                    </div>
                  )}
                </Flex>
              </Space>
            </Card>
          ))}
        </Space>
      }
    </Modal>
  );
}
