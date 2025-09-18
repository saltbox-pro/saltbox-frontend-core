import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import JsonForm from "@rjsf/antd";
import RjsfForm from "@rjsf/core";
import { RJSFValidationError } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { useNavigate } from "react-router";
import {
  Button,
  Cascader,
  Flex,
  Form,
  Input,
  Modal,
  Popover,
  Select,
  message,
} from "antd";
import { PlusOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import {
  CreateJobRequest,
  CreateJobRequestTgtTypeEnum,
  JobData,
  JobSchemaModel,
  JobSchemaShortSchema,
} from "@saltbox/saltbox-core-api-client";
import { saltTargetTypes } from "saltbox-core/shared/conf/salt-target-types";
import { apiCoreStore } from "saltbox-core/store";
import { MinionGatherModal } from "saltbox-core/shared/components/minion-gather-modal/minion-gather-modal";

import styles from "./job-modal.module.css";

interface JobOption {
  value: string;
  label: string;
  children?: JobOption[];
}

interface MasterOption {
  value: string;
  label: string;
}

type JobFormData = CreateJobRequest & { fun: string[] | number[] };

const searchFunctionAllowedSymbols = /[^a-zA-Z0-9._]/g;

export function JobModal({
  target,
  targetType,
}: {
  target: string;
  targetType: CreateJobRequestTgtTypeEnum;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGatherModalOpen, setIsGatherModalOpen] = useState(false);
  const [saltFunctionList, setSaltFunctionList] = useState<Array<JobOption>>(
    [],
  );
  const [saltFlatFunctionList, setSaltFlatFunctionList] = useState<
    Array<string>
  >([]);
  const [saltFunctionName, setSaltFunctionName] = useState<string>();
  const [saltFunction, setSaltFunction] = useState<JobSchemaModel>();
  const [masterList, setMasterList] = useState<MasterOption[]>([]);
  const [isSchemaListLoading, setIsSchemaListLoading] = useState(false);
  const [isMasterListLoading, setIsMasterListLoading] = useState(false);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [isJobCreating, setIsJobCreating] = useState(false);
  const [jsonFormValue, setJsonFormValue] = useState<JobData>({});
  const [searchFunctionName, setSearchFunctionName] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    RJSFValidationError[]
  >([]);
  const [functionHovered, setFunctionHovered] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm<JobFormData>();
  const refJobParamsForm = useRef<RjsfForm>(null);

  const saltMaster = Form.useWatch("salt_master", form);
  const tgt = Form.useWatch("tgt", form);
  const tgtType = Form.useWatch("tgt_type", form);

  const showModal = () => {
    setIsMasterListLoading(true);
    apiCoreStore.mastersApi
      ?.mastersList({ status: "accepted" })
      .then((result) => {
        if (result?.data?.length === 0) {
          messageApi.warning(t("job-modal.warning-message"));
          setIsModalOpen(false);
          return;
        }
        setMasterList(
          result?.data?.reduce<Array<MasterOption>>((list, master) => {
            list.push({
              label: master.title,
              value: master.master_id,
            });
            return list;
          }, []) ?? [],
        );
        setIsModalOpen(true);
      })
      .catch(() => {
        messageApi.error("Error on load salt masters.");
      })
      .finally(() => setIsMasterListLoading(false));
  };

  const fillSaltFunctionList = (jobsSchemes: JobSchemaShortSchema[]) => {
    const list: Array<JobOption> = [];
    const flatList: Array<string> = [];

    const jobList =
      jobsSchemes.reduce<Array<JobOption>>((options, item) => {
        options.push({
          label: item.name,
          value: item.name,
        });
        return options;
      }, []) ?? [];

    jobList.sort((a, b) =>
      a.label.toLowerCase() > b.label.toLowerCase()
        ? 1
        : a.label.toLowerCase() < b.label.toLowerCase()
          ? -1
          : 0,
    );

    jobList.forEach((saltFunction) => {
      const [moduleName] = saltFunction.value.split(".");
      const moduleIndex = list.findIndex((item) => item.label === moduleName);

      if (saltFunction.value == "default") {
        return;
      }

      flatList.push(saltFunction.value);

      if (moduleIndex > -1) {
        list[moduleIndex].children?.push({
          label: saltFunction.label,
          value: saltFunction.value,
        });
      } else {
        list.push({
          label: moduleName,
          value: `${moduleName}-module`,
          children: [
            {
              label: saltFunction.label,
              value: saltFunction.value,
            },
          ],
        });
      }
    });

    setSaltFunctionList(list);
    setSaltFlatFunctionList(flatList);
  };

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue({
      tgt: target,
      tgt_type: targetType,
    });
    refJobParamsForm.current?.reset();
    setSaltFunctionName(undefined);
    setSaltFunction(undefined);
    setJsonFormValue({});
    setIsSchemaListLoading(true);

    apiCoreStore.jsonSchemasApi
      ?.jobsSchemasList()
      .then((result) => {
        fillSaltFunctionList(result?.data ?? []);
      })
      .catch(() => {
        messageApi.error("Error on load salt function schemes.");
      })
      .finally(() => setIsSchemaListLoading(false));
  }, [isModalOpen]);

  useEffect(() => {
    if (validationErrors.length > 0) {
      const errorField = document.querySelector(
        `[id=job-params-form${validationErrors[0]?.property?.replaceAll(".", "-")}]`,
      );
      if (errorField) {
        errorField.scrollIntoView({ block: "center" });
      }
    }
  }, [validationErrors]);

  const handleModalCancel = () => {
    if (!isJobCreating) {
      setIsModalOpen(false);
    }
  };

  const handleFormFinish = (formValue: JobFormData) => {
    const isFormValid = refJobParamsForm.current?.validateForm();
    if (!isFormValid) return;

    setIsJobCreating(true);

    apiCoreStore.jobsApi
      ?.jobCreate({
        CreateJobRequest: {
          tgt: formValue.tgt,
          fun: formValue.fun.at(-1),
          tgt_type: formValue.tgt_type,
          salt_master: formValue.salt_master,
          data: jsonFormValue,
        },
      })
      .then((response) => {
        setIsModalOpen(false);
        if (response?.jid) {
          navigate(`/job/${response.jid}`);
        }
      })
      .catch((_) => {
        messageApi.error(`Error on job created.`);
      })
      .finally(() => setIsJobCreating(false));
  };

  const handleFormFinishFailed = (errorInfo: any) => {
    if (errorInfo.errorFields.length) {
      const fieldName = errorInfo.errorFields[0].name.join("_");
      const element = document.querySelector(`[id="job-form_${fieldName}"]`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            block: "center",
          });
        }, 100);
      }
    }
  };

  useEffect(() => {
    setJsonFormValue({});
    setSaltFunction(undefined);

    if (saltFunctionName === undefined) {
      return;
    }

    if (
      isCustomSaltFunction(saltFunctionName) &&
      !isValidCustomSaltFunction(saltFunctionName)
    ) {
      return;
    }

    setIsSchemaLoading(true);
    apiCoreStore.jsonSchemasApi
      .jobsSchemasGet({ name: saltFunctionName })
      .then((result) => {
        setSaltFunction(result);
      })
      .catch(() => {
        messageApi.error("Error on load salt function schema.");
      })
      .finally(() => setIsSchemaLoading(false));
  }, [saltFunctionName]);

  const handleFunctionNameSearch = (searchText: string) => {
    const filteredSearchText = searchText
      .toLocaleLowerCase()
      .trim()
      .replaceAll(searchFunctionAllowedSymbols, "");
    if (!isCustomSaltFunction(filteredSearchText) && hasCustomSaltFunction()) {
      setSaltFunctionList(saltFunctionList.slice(1));
    } else if (filteredSearchText === "" && hasCustomSaltFunction()) {
      setSaltFunctionList(saltFunctionList.slice(1));
    } else if (
      isCustomSaltFunction(filteredSearchText) &&
      !hasCustomSaltFunction()
    ) {
      setSaltFunctionList([
        {
          label: filteredSearchText,
          value: filteredSearchText,
        },
        ...saltFunctionList,
      ]);
    } else if (
      isCustomSaltFunction(filteredSearchText) &&
      hasCustomSaltFunction()
    ) {
      setSaltFunctionList([
        {
          label: filteredSearchText,
          value: filteredSearchText,
        },
        ...saltFunctionList.slice(1),
      ]);
    }

    setSearchFunctionName(filteredSearchText);
  };

  const handleSaltFunctionChange = (values: string[] | undefined) => {
    const newSaltFunctionName = values?.at(-1);
    const firstSaltFunctionNameInList = saltFunctionList?.at(0)?.value;
    if (
      saltFunctionList?.at(0)?.children === undefined &&
      newSaltFunctionName != firstSaltFunctionNameInList
    ) {
      setSaltFunctionList(saltFunctionList.slice(1));
    }

    setSaltFunctionName(newSaltFunctionName);
  };

  const isValidCustomSaltFunction = (value: string): boolean => {
    return /^[_0-9a-z]+\.[_0-9a-z]+$/i.test(value);
  };

  const hasCustomSaltFunction = (): boolean => {
    const funcName = saltFunctionList?.[0]?.value;
    if (saltFunctionList?.[0]?.children?.length ?? 0 > 0) {
      return false;
    }
    return isCustomSaltFunction(funcName);
  };

  const isCustomSaltFunction = (funcName?: string | undefined): boolean => {
    return funcName ? !saltFlatFunctionList.includes(funcName) : false;
  };

  const handleFunctionHoverChange = (open: boolean) => {
    setFunctionHovered(open);
  };

  const isLoading =
    isSchemaListLoading ||
    isMasterListLoading ||
    isSchemaLoading ||
    isJobCreating;

  return (
    <>
      {contextHolder}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showModal}
        loading={isMasterListLoading}
      >
        {t("job-modal.create-job")}
      </Button>

      <Modal
        title={t("job-modal.title")}
        open={isModalOpen}
        onCancel={handleModalCancel}
        width="800px"
        maskClosable={false}
        footer={
          <>
            <Button
              type="default"
              disabled={isLoading}
              onClick={handleModalCancel}
            >
              {t("job-modal.cancel")}
            </Button>

            <Button
              loading={isLoading}
              type="primary"
              form="job-form"
              key="submit"
              htmlType="submit"
            >
              {t("job-modal.create")}
            </Button>
          </>
        }
        closable={false}
      >
        <Form
          form={form}
          name="job-form"
          layout={"vertical"}
          onFinish={handleFormFinish}
          onFinishFailed={handleFormFinishFailed}
          autoComplete="off"
          id="job-form"
        >
          <Form.Item<JobFormData>
            label={t("job-modal.salt-master")}
            name="salt_master"
            rules={[
              {
                required: true,
                message: t("job-modal.salt-master-error-required"),
              },
            ]}
          >
            <Select allowClear options={masterList} />
          </Form.Item>
          <Flex gap={8}>
            <Form.Item<JobFormData>
              label={t("job-modal.target-type")}
              name="tgt_type"
              rules={[
                {
                  required: true,
                  message: t("job-modal.tgt-type-error-required"),
                },
              ]}
              className={styles.jobFormTgtType}
            >
              <Select
                options={saltTargetTypes}
                optionLabelProp="value"
                styles={{
                  popup: {
                    root: {
                      minWidth: 450,
                    },
                  },
                }}
              />
            </Form.Item>

            <Form.Item<JobFormData>
              label={t("job-modal.target")}
              name="tgt"
              rules={[
                { required: true, message: t("job-modal.tgt-error-required") },
              ]}
              className={styles.jobFormTgt}
            >
              <Input />
            </Form.Item>

            <Button
              icon={<SearchOutlined />}
              onClick={() => setIsGatherModalOpen(true)}
              disabled={!saltMaster || !tgt || !tgtType}
              className={styles.jobFormGather}
            />
          </Flex>

          <Form.Item<JobFormData>
            label={
              <Flex gap={4} align="center">
                <span>{t("job-modal.function")}</span>
                <Popover
                  style={{ width: 500 }}
                  content={t("job-modal.function-tooltip")}
                  trigger="hover"
                  open={functionHovered}
                  onOpenChange={handleFunctionHoverChange}
                >
                  <QuestionCircleOutlined />
                </Popover>
              </Flex>
            }
            name="fun"
            rules={[
              {
                required: true,
                message: t("job-modal.function-error-required"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    value?.length === 1 &&
                    isCustomSaltFunction(value?.[0]) &&
                    !isValidCustomSaltFunction(value?.[0])
                  ) {
                    return Promise.reject(
                      new Error("Function must have MODULE.FUNCTION format."),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Cascader
              options={saltFunctionList}
              disabled={isSchemaListLoading}
              showSearch={true}
              onSearch={handleFunctionNameSearch}
              searchValue={searchFunctionName}
              onChange={handleSaltFunctionChange}
            />
          </Form.Item>

          {saltFunction && (
            <JsonForm
              ref={refJobParamsForm}
              schema={saltFunction.json_schema}
              uiSchema={saltFunction?.ui_schema}
              validator={validator}
              tagName="div"
              id="job-params-form"
              className={styles.jobParamsForm}
              idPrefix="job-params-form"
              idSeparator="-"
              showErrorList={false}
              formData={jsonFormValue}
              onChange={(d) => setJsonFormValue(d?.formData)}
              onError={(errors) => setValidationErrors(errors)}
            >
              <Fragment />
            </JsonForm>
          )}
        </Form>
      </Modal>

      <MinionGatherModal
        isOpen={isGatherModalOpen}
        onClose={() => setIsGatherModalOpen(false)}
        target={tgt ?? ""}
        targetType={tgtType}
        master={saltMaster ?? ""}
      />
    </>
  );
}
