import { Button } from "antd";

type CreateTemplateSourceModalFooterProps = {
  formId: string;
  isSubmitting: boolean;
  cancelLabel: string;
  createLabel: string;
  onCancel: () => void;
};

export function CreateTemplateSourceModalFooter({
  formId,
  isSubmitting,
  cancelLabel,
  createLabel,
  onCancel,
}: CreateTemplateSourceModalFooterProps) {
  return (
    <>
      <Button disabled={isSubmitting} onClick={onCancel}>
        {cancelLabel}
      </Button>

      <Button type="primary" htmlType="submit" form={formId} loading={isSubmitting}>
        {createLabel}
      </Button>
    </>
  );
}
