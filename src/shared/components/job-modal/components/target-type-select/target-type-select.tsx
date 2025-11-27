import { forwardRef, FC } from "react";
import { Flex, Select, Typography } from "antd";
import type { SelectProps, RefSelectProps } from "antd/es/select";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Popover } from "@saltbox/saltbox-frontend-common";
import {
  TargetTypeHint as TargetTypeHintData,
  useSaltTargetTypes,
} from "saltbox-core/shared/conf/salt-target-types";
import { CodeBlock } from "../code-block/code-block";

import styles from "./target-type-select.module.css";

type TargetTypeHintProps = {
  data: TargetTypeHintData;
};

const TargetTypeHint: FC<TargetTypeHintProps> = ({ data }) => {
  const { t } = useTranslation();

  return (
    <Flex vertical gap={4} className={styles.hintRoot}>
      <Typography.Text strong>{data.title}</Typography.Text>
      <Typography.Text>{data.description}</Typography.Text>
      <Typography.Text strong>
        {t("job-modal.hint-example-label")}
      </Typography.Text>
      <CodeBlock canCopy content={data.example} />
      <Typography.Text>{data.exampleDescription}</Typography.Text>
    </Flex>
  );
};

export const TargetTypeSelect = forwardRef<RefSelectProps, SelectProps>(
  (props, ref) => {
    const saltTargetTypes = useSaltTargetTypes();

    return (
      <Select
        ref={ref}
        {...props}
        options={saltTargetTypes}
        optionLabelProp="value"
        optionRender={(option) => {
          return (
            <Flex justify="space-between" gap={8}>
              <span className={styles.optionLabel} title={String(option.label)}>
                {option.label}
              </span>
              <Popover
                content={
                  <TargetTypeHint
                    data={option.data.hint}
                  />
                }
                trigger="hover"
                placement="right"
              >
                <QuestionCircleOutlined />
              </Popover>
            </Flex>
          );
        }}
        styles={{
          popup: {
            root: {
              minWidth: 450,
            },
          },
        }}
      />
    );
  }
);
