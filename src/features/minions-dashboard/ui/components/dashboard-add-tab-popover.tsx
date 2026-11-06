import { PlusOutlined } from "@ant-design/icons";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { Button, Checkbox, Flex, Form, Input, InputRef } from "antd";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DashboardAddTabValues } from "../../hooks/use-dashboard-add-tab";
import { TabNameError } from "../../model/dashboard-model";

import styles from "./dashboard-add-tab-popover.module.css";

type DashboardAddTabFormProps = {
  defaultName: string;
  error: TabNameError | null;
  onSubmit: (values: DashboardAddTabValues) => void;
  onChange: () => void;
  onCancel: () => void;
};

const DashboardAddTabForm = ({
  defaultName,
  error,
  onSubmit,
  onChange,
  onCancel,
}: DashboardAddTabFormProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<InputRef>(null);

  useLayoutEffect(() => {
    inputRef.current?.focus({ preventScroll: true, cursor: "all" });
  }, []);

  return (
    <Form<DashboardAddTabValues>
      layout="vertical"
      className={styles.addTabForm}
      initialValues={{ name: defaultName, local: false }}
      onValuesChange={onChange}
      onFinish={onSubmit}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          onCancel();
        }
      }}
    >
      <Form.Item
        name="name"
        validateStatus={error ? "error" : undefined}
        help={error ? t(`dashboard.tab-name-${error}`) : undefined}
      >
        <Input ref={inputRef} placeholder={t("dashboard.tab-name-placeholder")} />
      </Form.Item>
      <Form.Item name="local" valuePropName="checked">
        <Checkbox>{t("dashboard.tab-local-checkbox")}</Checkbox>
      </Form.Item>
      <Flex justify="end">
        <Button type="primary" htmlType="submit">
          {t("common.add")}
        </Button>
      </Flex>
    </Form>
  );
};

type DashboardAddTabPopoverProps = {
  className: string;
  anchor: HTMLElement | null;
  defaultName: string;
  error: TabNameError | null;
  onOpen: (anchor: HTMLElement | null) => void;
  onClose: () => void;
  onSubmit: (values: DashboardAddTabValues) => void;
  onChange: () => void;
};

export const DashboardAddTabPopover = ({
  className,
  anchor,
  defaultName,
  error,
  onOpen,
  onClose,
  onSubmit,
  onChange,
}: DashboardAddTabPopoverProps) => {
  const [trigger, setTrigger] = useState<HTMLSpanElement | null>(null);
  const open = anchor !== null && trigger !== null && anchor.contains(trigger);

  return (
    <Popover
      open={open}
      trigger="click"
      placement="bottomLeft"
      destroyOnHidden
      content={
        <DashboardAddTabForm
          defaultName={defaultName}
          error={error}
          onSubmit={onSubmit}
          onChange={onChange}
          onCancel={onClose}
        />
      }
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpen(trigger?.closest("button") ?? null);
        } else {
          onClose();
        }
      }}
    >
      <span ref={setTrigger} className={className}>
        <PlusOutlined />
      </span>
    </Popover>
  );
};
