import {
  Checkbox,
  type CheckboxChangeEvent,
  Form,
  type FormRule,
  Input,
  type InputRef,
  Modal,
} from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import type {
  DashboardAddTabValues,
  DashboardTabScope,
  TabNameError,
} from "../../model/dashboard-model";

type DashboardAddTabModalProps = {
  open: boolean;
  defaultName: string;
  validateName: (name: string, scope: DashboardTabScope) => TabNameError | null;
  onSubmit: (values: DashboardAddTabValues) => void;
  onCancel: () => void;
};

const INITIAL_SCOPE: DashboardTabScope = "global";

const toScope = (event: CheckboxChangeEvent): DashboardTabScope => {
  return event.target.checked ? "local" : "global";
};

const toCheckboxProps = (scope: DashboardTabScope) => ({ checked: scope === "local" });

export const DashboardAddTabModal = ({
  open,
  defaultName,
  validateName,
  onSubmit,
  onCancel,
}: DashboardAddTabModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<DashboardAddTabValues>();
  const inputRef = useRef<InputRef>(null);

  const nameRule: FormRule = ({ getFieldValue }) => ({
    validator: (_, name: string | undefined) => {
      const error = validateName(name ?? "", getFieldValue("scope"));
      return error
        ? Promise.reject(new Error(t(`dashboard.tab-name-${error}`)))
        : Promise.resolve();
    },
  });

  const handleAfterOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      inputRef.current?.focus({ cursor: "all" });
    }
  };

  return (
    <Modal
      open={open}
      title={t("dashboard.add-tab-title")}
      okText={t("common.add")}
      cancelText={t("common.cancel")}
      width={400}
      destroyOnHidden
      afterOpenChange={handleAfterOpenChange}
      onOk={() => form.submit()}
      onCancel={onCancel}
    >
      <Form<DashboardAddTabValues>
        form={form}
        layout="vertical"
        initialValues={{ name: defaultName, scope: INITIAL_SCOPE }}
        clearOnDestroy
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label={t("dashboard.tab-name-label")}
          dependencies={["scope"]}
          rules={[nameRule]}
        >
          <Input ref={inputRef} />
        </Form.Item>
        <Form.Item name="scope" getValueFromEvent={toScope} getValueProps={toCheckboxProps}>
          <Checkbox>{t("dashboard.tab-local-checkbox")}</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};
