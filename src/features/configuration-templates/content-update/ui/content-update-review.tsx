import { TaskType, type TaskListResponseSchema } from "@saltbox/saltbox-core-api-client";
import { getLocalizedText } from "@saltbox/saltbox-frontend-common";
import { Alert, Checkbox, Collapse, type CollapseProps, Flex, Tag, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TemplateSourceTemplatesList } from "saltbox-core/features/template-source-ui";
import { TaskStatusIndicator } from "saltbox-core/shared/components/task-status-indicator/task-status-indicator";

import { CollapsePanelLabel } from "../../shared/ui/collapse-panel-label";
import collapseStyles from "../../shared/ui/template-source-extras-collapse.module.css";
import type { ContentUpdateCheckResult } from "../types/content-update";

import { ChangedFilesList } from "./changed-files-list";
import styles from "./content-update-review.module.css";

const I18N_PREFIX = "configuration-templates.source-update";
const SCHEDULER_SOURCE_TYPE = "scheduler";

const { Text, Link } = Typography;

type ContentUpdateReviewProps = {
  result: ContentUpdateCheckResult;
  stopDependents: boolean;
  disabled?: boolean;
  onStopDependentsChange: (value: boolean) => void;
};

function DependantTaskRow({ task }: { task: TaskListResponseSchema }) {
  const { t, i18n } = useTranslation();
  const title =
    getLocalizedText(task.task_template?.title, i18n.language) ||
    task.task_template?.name ||
    task.fun;

  return (
    <Flex align="center" justify="space-between" gap="middle" className={styles.row} wrap>
      <Flex vertical className={styles.taskInfo}>
        <Flex align="center" gap="small">
          <Link href={`/core/task/${encodeURIComponent(task.id)}`} target="_blank" rel="noreferrer">
            {title}
          </Link>
          {task.source?.type === SCHEDULER_SOURCE_TYPE && (
            <Tag>{t(`${I18N_PREFIX}.scheduler-tag`)}</Tag>
          )}
        </Flex>
        {task.target_collection?.title && (
          <Text type="secondary">{task.target_collection.title}</Text>
        )}
      </Flex>
      <TaskStatusIndicator status={task.status?.type} reason={task.status?.data?.reason} />
    </Flex>
  );
}

export function ContentUpdateReview({
  result,
  stopDependents,
  disabled = false,
  onStopDependentsChange,
}: ContentUpdateReviewProps) {
  const { t } = useTranslation();

  const { tasks, policies } = useMemo(
    () => ({
      tasks: result.dependant_tasks.filter((task) => task.task_type !== TaskType.Policy),
      policies: result.dependant_tasks.filter((task) => task.task_type === TaskType.Policy),
    }),
    [result.dependant_tasks]
  );

  const dependantsCount = result.dependant_tasks.length;

  const items = useMemo(() => {
    const collapseItems: NonNullable<CollapseProps["items"]> = [
      {
        key: "templates",
        label: (
          <CollapsePanelLabel
            title={t(`${I18N_PREFIX}.templates-title`)}
            count={result.templates.length}
          />
        ),
        children:
          result.templates.length > 0 ? (
            <TemplateSourceTemplatesList items={result.templates} />
          ) : (
            <Text type="secondary">{t(`${I18N_PREFIX}.templates-empty`)}</Text>
          ),
      },
      {
        key: "files",
        label: (
          <CollapsePanelLabel title={t(`${I18N_PREFIX}.files-title`)} count={result.files.length} />
        ),
        children: <ChangedFilesList files={result.files} />,
      },
    ];

    if (tasks.length > 0) {
      collapseItems.push({
        key: "tasks",
        label: <CollapsePanelLabel title={t(`${I18N_PREFIX}.tasks-title`)} count={tasks.length} />,
        children: (
          <div className={styles.list}>
            {tasks.map((task) => (
              <DependantTaskRow key={task.id} task={task} />
            ))}
          </div>
        ),
      });
    }

    if (policies.length > 0) {
      collapseItems.push({
        key: "policies",
        label: (
          <CollapsePanelLabel title={t(`${I18N_PREFIX}.policies-title`)} count={policies.length} />
        ),
        children: (
          <div className={styles.list}>
            {policies.map((task) => (
              <DependantTaskRow key={task.id} task={task} />
            ))}
          </div>
        ),
      });
    }

    return collapseItems;
  }, [policies, result.files, result.templates, t, tasks]);

  return (
    <Flex vertical gap="middle">
      <Collapse
        className={collapseStyles.collapse}
        size="small"
        items={items}
        defaultActiveKey={["templates", "tasks", "policies"]}
      />

      {dependantsCount > 0 && (
        <>
          <Checkbox
            checked={stopDependents}
            disabled={disabled}
            onChange={(event) => onStopDependentsChange(event.target.checked)}
          >
            {t(`${I18N_PREFIX}.stop-dependents`, { count: dependantsCount })}
          </Checkbox>

          <Alert type="warning" showIcon message={t(`${I18N_PREFIX}.dependents-warning`)} />
        </>
      )}
    </Flex>
  );
}
