import { Modal, List, Button } from "antd";
import { StarOutlined, FileTextOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { BranchesOutlined } from "@ant-design/icons";
import { Modal as AntModal } from "antd";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import yaml from "js-yaml";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Light } from "react-syntax-highlighter/dist/esm/styles/hljs";

export interface SaltBoxProject {
  id: number;
  name: string;
  description: string | null;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  created_at: string;
  default_branch: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  web_url: string;
  readme_url: string;
  star_count: number;
  forks_count: number;
  tag_list: string[];
  topics: string[];
  visibility: string;
  last_activity_at: string;
  updated_at: string;
  empty_repo: boolean;
  archived: boolean;
  marked_for_deletion_on: string | null;
  marked_for_deletion_at: string | null;
}

interface SaltBoxProjectsModalProps {
  open: boolean;
  onClose: () => void;
  projects: SaltBoxProject[];
  loading: boolean;
  total?: number;
  skip?: number;
  limit?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onAdd?: (project: SaltBoxProject) => void;
}

export const SaltBoxProjectsModal = ({ open, onClose, projects, loading, total = 0, skip = 0, limit = 20, onPageChange, onAdd }: SaltBoxProjectsModalProps) => {
  const currentPage = Math.floor(skip / limit) + 1;
  const [manifestMode, setManifestMode] = useState(false);
  const [readmeModalOpen, setReadmeModalOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState("");
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeTitle, setReadmeTitle] = useState("");

  const handleShowReadme = async (project: SaltBoxProject) => {
    setReadmeModalOpen(true);
    setReadmeLoading(true);
    setManifestMode(false);
    setReadmeTitle(project.name);
    try {
      // Получаем basePath и токен из стора
      // @ts-ignore
      const { apiCoreStore, appStore } = require("saltbox-core/store");
      const basePath = apiCoreStore.env?.api_base_path;
      const token = appStore.authStore?.user?.access_token;
      const response = await fetch(`${basePath}/settings/gitlab/${project.id}/readme`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Ошибка загрузки README");
      const json = await response.json();
      setReadmeContent(json.content || "");
    } catch {
      setReadmeContent("Ошибка загрузки README");
    }
    setReadmeLoading(false);
  };

  const handleShowManifest = async (project: SaltBoxProject) => {
    setReadmeModalOpen(true);
    setReadmeLoading(true);
    setManifestMode(true);
    setReadmeTitle(project.name);
    try {
      // Получаем basePath и токен из стора
      // @ts-ignore
      const { apiCoreStore, appStore } = require("saltbox-core/store");
      const basePath = apiCoreStore.env?.api_base_path;
      const token = appStore.authStore?.user?.access_token;
      const response = await fetch(`${basePath}/settings/gitlab/${project.id}/manifest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Ошибка загрузки manifest.yaml");
      const json = await response.json();
      setReadmeContent(json.content || "");
    } catch {
      setReadmeContent("Ошибка загрузки manifest.yaml");
    }
    setReadmeLoading(false);
  };
  // Функция форматирования даты и времени
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).replace(/\./g, ".");
  };

  return (
    <Modal
      title="Проекты Salt.Box"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>Всего проектов: {total}</div>
          <div>
            <span style={{ marginRight: 8 }}>Показывать по:</span>
            <select value={limit} onChange={e => onPageChange?.(1, Number(e.target.value))}>
              {[2, 5, 10, 50].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <List
          loading={loading}
          dataSource={projects}
          renderItem={item => (
          <List.Item
            style={{ alignItems: 'flex-start', padding: '18px 0', borderBottom: '1px solid #f0f0f0' }}
            actions={[
              <Button type="primary" onClick={() => typeof onAdd === 'function' && onAdd(item)} key="add">Добавить</Button>
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ fontWeight: 500, fontSize: 18 }}>
                  <a href={item.web_url} target="_blank" rel="noopener noreferrer">{item.name}</a>
                  <span style={{ marginLeft: 12, color: '#999', fontSize: 14 }}>({item.visibility})</span>
                </div>
              }
              description={
                <div style={{ marginTop: 4 }}>
                  <div style={{ color: '#555', marginBottom: 6 }}>{item.description || <span style={{ color: '#bbb' }}>Нет описания</span>}</div>
                  <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span title="Последнее обновление">
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {formatDateTime(item.updated_at)}
                    </span>
                    <span title="Ветка">
                      <BranchesOutlined style={{ marginRight: 4 }} />
                      <b>{item.default_branch}</b>
                    </span>
                    <span title="Звёзды">
                      <StarOutlined style={{ marginRight: 4 }} />
                      <b>{item.star_count}</b>
                    </span>
                    <span title="README">
                      <Button
                        type="link"
                        style={{ padding: 0, height: 'auto' }}
                        icon={<FileTextOutlined style={{ marginRight: 4 }} />}
                        onClick={() => handleShowReadme(item)}
                      >README</Button>
                    </span>
                    <span title="manifest.yaml">
                      <Button
                        type="link"
                        style={{ padding: 0, height: 'auto' }}
                        icon={<FileTextOutlined style={{ marginRight: 4 }} />}
                        onClick={() => handleShowManifest(item)}
                      >manifest.yaml</Button>
                    </span>
      {/* Модальное окно для README */}
      <AntModal
        title={`README: ${readmeTitle}`}
        open={readmeModalOpen}
        onCancel={() => setReadmeModalOpen(false)}
        footer={null}
        width={800}
      >
        {readmeLoading ? (
          <div>Загрузка...</div>
        ) : manifestMode ? (
          <div style={{ background: '#fafafa', padding: 0, borderRadius: 8, maxHeight: 600, overflow: 'auto' }}>
            <SyntaxHighlighter language="yaml" style={Light} customStyle={{ borderRadius: 8, fontSize: 14, margin: 0, padding: 16 }}>
              {readmeContent}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 600, overflow: 'auto' }}>
            <ReactMarkdown>{readmeContent}</ReactMarkdown>
          </div>
        )}
      </AntModal>
                  </div>
                </div>
              }
            />
          </List.Item>
          )}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Button
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1, limit)}
            style={{ marginRight: 8 }}
          >Назад</Button>
          <span>Страница {currentPage} из {Math.max(1, Math.ceil(total / limit))}</span>
          <Button
            disabled={currentPage >= Math.ceil(total / limit)}
            onClick={() => onPageChange?.(currentPage + 1, limit)}
            style={{ marginLeft: 8 }}
          >Вперёд</Button>
        </div>
      </div>
    </Modal>
  );
};
