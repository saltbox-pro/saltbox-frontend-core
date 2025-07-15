import { Form, Input, Button, Space } from "antd"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { PillarModel } from "saltbox-core-api"

interface PillarCreateFormProps {
    masterId: string
    onSubmit: (values: { name: string; value: string; minionId?: string }) => Promise<boolean>
    onCancel: () => void
    initialValues?: {
        name: string
        value: string
        minionId?: string
    }
    onlyValueField?: boolean
}

interface FormValues {
    name: string
    value: string
    minionId?: string
}

export const PillarCreateForm = observer((props: PillarCreateFormProps) => {
    const { t } = useTranslation()
    const [form] = Form.useForm<FormValues>()
    const { onlyValueField } = props

    useEffect(() => {
        if (props.initialValues) {
            form.setFieldsValue(props.initialValues)
        }
    }, [props.initialValues, form])

    const handleSubmit = async (values: FormValues) => {
        let submitValues = { ...values };

        if (submitValues.name) {
            submitValues.name = submitValues.name.trim().replace(/\t/g, '');
        }

        if (submitValues.value) {
            submitValues.value = submitValues.value.trim().replace(/\t/g, '');
        }

        if (onlyValueField && props.initialValues) {
            if (!submitValues.name) submitValues.name = props.initialValues.name;
            if (submitValues.minionId === undefined) submitValues.minionId = props.initialValues.minionId;
        }
        const success = await props.onSubmit(submitValues)
        if (success) {
            props.onCancel()
        }
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={props.initialValues || { name: "", value: "" }}
        >
            {!onlyValueField && (
                <Form.Item
                    name="minionId"
                    label={t("pillars.form-minion-id")}
                    tooltip={t("pillars.form-minion-id-tooltip")}
                >
                    <Input placeholder={t("pillars.form-minion-id-placeholder")} />
                </Form.Item>
            )}
            {!onlyValueField && (
                <Form.Item
                    name="name"
                    label={t("pillars.form-name")}
                    tooltip={t("pillars.form-name-tooltip")}
                    rules={[
                        {
                            required: true,
                            message: t("pillars.form-name-required"),
                        },
                    ]}
                >
                    <Input placeholder={t("pillars.form-name-placeholder")} />
                </Form.Item>
            )}
            <Form.Item
                name="value"
                label={t("pillars.form-value")}
                tooltip={t("pillars.form-value-tooltip")}
                rules={[
                    {
                        required: true,
                        message: t("pillars.form-value-required"),
                    },
                ]}
            >
                <Input.TextArea
                    rows={4}
                    placeholder={t("pillars.form-value-placeholder")}
                />
            </Form.Item>
            <Form.Item>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Button onClick={props.onCancel}>
                        {t("pillars.form-cancel")}
                    </Button>
                    <Button type="primary" htmlType="submit">
                        {t("pillars.form-submit")}
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
})
