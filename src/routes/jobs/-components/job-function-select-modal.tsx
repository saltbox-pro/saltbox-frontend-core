import { Modal, SearchInput } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Empty, Flex, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import styles from "./job-function-select-modal.module.css";

interface JobFunctionSelectModalProps {
  open: boolean;
  onCancel: () => void;
  onSelect: (functionName: string) => void;
}

type ModuleRow = {
  key: string;
  moduleName: string;
  description: string;
  functions: string[];
};

type FunctionArgument = {
  name: string;
  type?: string;
  required: boolean;
  description?: string;
};

type FunctionTooltipData = {
  name: string;
  description?: string;
  arguments: FunctionArgument[];
  example?: string;
  isLoadError?: boolean;
};

type FunctionSchemaProperty = {
  type?: string | string[];
  description?: string;
  properties?: Record<string, FunctionSchemaProperty>;
  required?: string[];
};

type FunctionSchema = {
  description?: string;
  title?: string;
  example?: string;
  properties?: Record<string, FunctionSchemaProperty>;
};

type FunctionUiSchemaProperty = {
  "ui:description"?: string;
  "ui:title"?: string;
};

type FunctionUiSchema = {
  "ui:description"?: string;
  [argumentName: string]: unknown;
};

const EXCLUDED_FUNCTIONS = new Set(["default"]);
const getFunctionDisplayName = (functionName: string): string => {
  const functionNameParts = functionName.split(".");
  return functionNameParts[functionNameParts.length - 1] || functionName;
};

const buildModuleRows = (
  schemaNames: string[],
  t: TFunction<"translation", undefined>
): ModuleRow[] => {
  const groupedFunctions = schemaNames.reduce<Map<string, string[]>>(
    (moduleFunctionsMap, schemaName) => {
      if (EXCLUDED_FUNCTIONS.has(schemaName)) {
        return moduleFunctionsMap;
      }

      const [moduleName] = schemaName.split(".");
      if (!moduleName) {
        return moduleFunctionsMap;
      }

      const moduleFunctions = moduleFunctionsMap.get(moduleName) ?? [];
      moduleFunctionsMap.set(moduleName, [...moduleFunctions, schemaName]);
      return moduleFunctionsMap;
    },
    new Map<string, string[]>()
  );

  return Array.from(groupedFunctions.entries())
    .map(([moduleName, functions]) => ({
      key: moduleName,
      moduleName,
      description: t(`job-function-select.module-descriptions.${moduleName}`, {
        defaultValue: t("job-function-select.module-descriptions.default", {
          module: moduleName,
        }),
      }),
      functions: functions.sort((firstFunction, secondFunction) =>
        firstFunction.localeCompare(secondFunction)
      ),
    }))
    .sort((firstModule, secondModule) =>
      firstModule.moduleName.localeCompare(secondModule.moduleName)
    );
};

const filterModuleRows = (moduleRows: ModuleRow[], appliedSearchQuery: string): ModuleRow[] => {
  const normalizedSearchValue = appliedSearchQuery.trim().toLowerCase();
  if (!normalizedSearchValue) {
    return moduleRows;
  }

  return moduleRows
    .map((moduleRow) => {
      const filteredFunctions = moduleRow.functions.filter((functionName) =>
        functionName.toLowerCase().includes(normalizedSearchValue)
      );
      const moduleMatch =
        moduleRow.moduleName.toLowerCase().includes(normalizedSearchValue) ||
        moduleRow.description.toLowerCase().includes(normalizedSearchValue);

      if (moduleMatch) {
        return moduleRow;
      }

      if (filteredFunctions.length === 0) {
        return null;
      }

      return {
        ...moduleRow,
        functions: filteredFunctions,
      };
    })
    .filter((moduleRow): moduleRow is ModuleRow => moduleRow !== null);
};

const buildFunctionTooltipData = (
  functionName: string,
  schema: FunctionSchema,
  uiSchema: FunctionUiSchema = {}
): FunctionTooltipData => {
  const kwargsSchema = schema.properties?.kwargs;
  const schemaProperties = kwargsSchema?.properties ?? {};
  const requiredProperties = kwargsSchema?.required ?? [];
  const uiKwargs = (uiSchema.kwargs as Record<string, FunctionUiSchemaProperty> | undefined) ?? {};

  const argumentsList = Object.entries(schemaProperties).map(([argumentName, argumentSchema]) => {
    const uiArgument = uiKwargs[argumentName];
    const argumentType = Array.isArray(argumentSchema.type)
      ? argumentSchema.type.join(" | ")
      : argumentSchema.type;
    const argumentDisplayName = uiArgument?.["ui:title"] ?? argumentName;
    const argumentDescription = uiArgument?.["ui:description"] ?? argumentSchema.description;

    return {
      name: argumentDisplayName,
      type: argumentType,
      required: requiredProperties.includes(argumentName),
      description: argumentDescription,
    };
  });

  return {
    name: getFunctionDisplayName(functionName),
    description: schema.description ?? schema.title ?? uiSchema["ui:description"],
    arguments: argumentsList,
    example: schema.example,
  };
};

export const JobFunctionSelectModal = ({
  open,
  onCancel,
  onSelect,
}: JobFunctionSelectModalProps) => {
  const { t } = useTranslation();
  const [moduleRows, setModuleRows] = useState<ModuleRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [functionTooltips, setFunctionTooltips] = useState<Record<string, FunctionTooltipData>>({});
  const [functionTooltipsLoading, setFunctionTooltipsLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [tooltipResetCounter, setTooltipResetCounter] = useState(0);

  const resetModalState = useCallback(() => {
    setAppliedSearchQuery("");
    setModuleRows([]);
    setFunctionTooltips({});
    setFunctionTooltipsLoading({});
    setTooltipResetCounter((prevState) => prevState + 1);
    setIsLoading(false);
    setIsError(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetModalState();
      return;
    }

    let isCancelled = false;
    setIsError(false);
    setModuleRows([]);
    setIsLoading(true);
    apiCoreStore.jsonSchemasApi
      ?.jobsSchemasList({
        JobSchemaListBody: {},
      })
      .then((result) => {
        if (isCancelled) {
          return;
        }
        const schemaNames = (result?.data ?? []).map((schema) => schema.name);
        setModuleRows(buildModuleRows(schemaNames, t));
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }
        setIsError(true);
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }
        setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [open, resetModalState, t]);

  const filteredRows = useMemo(
    () => filterModuleRows(moduleRows, appliedSearchQuery),
    [moduleRows, appliedSearchQuery]
  );

  const hasNoData = !isLoading && !isError && moduleRows.length === 0;
  const hasNoResults = !isLoading && !isError && moduleRows.length > 0 && filteredRows.length === 0;
  const shouldShowTable = !isLoading && !isError && filteredRows.length > 0;

  const handleFunctionHover = useCallback(
    (functionName: string) => {
      if (functionTooltipsLoading[functionName]) {
        return;
      }

      const cachedTooltip = functionTooltips[functionName];
      if (cachedTooltip && !cachedTooltip.isLoadError) {
        return;
      }

      setFunctionTooltipsLoading((prevState) => ({
        ...prevState,
        [functionName]: true,
      }));

      apiCoreStore.jsonSchemasApi
        ?.jobsSchemasGet({ name: functionName })
        .then((result) => {
          const tooltipData = buildFunctionTooltipData(
            functionName,
            result?.json_schema as FunctionSchema,
            (result?.ui_schema ?? {}) as FunctionUiSchema
          );

          setFunctionTooltips((prevState) => ({
            ...prevState,
            [functionName]: tooltipData,
          }));
        })
        .catch(() => {
          setFunctionTooltips((prevState) => ({
            ...prevState,
            [functionName]: {
              name: functionName,
              arguments: [],
              isLoadError: true,
            },
          }));
        })
        .finally(() => {
          setFunctionTooltipsLoading((prevState) => ({
            ...prevState,
            [functionName]: false,
          }));
        });
    },
    [functionTooltips, functionTooltipsLoading]
  );

  const renderFunctionTooltip = useCallback(
    (functionName: string) => {
      const isTooltipLoading = functionTooltipsLoading[functionName];
      const tooltipData = functionTooltips[functionName];

      if (isTooltipLoading) {
        return (
          <div className={styles.spinnerContainer}>
            <Spin />
          </div>
        );
      }

      if (!tooltipData) {
        return <span>{getFunctionDisplayName(functionName)}</span>;
      }

      if (tooltipData.isLoadError) {
        return <span>{t("job-function-select.error")}</span>;
      }

      return (
        <div className={styles.tooltipContent} onWheel={(event) => event.stopPropagation()}>
          <div className={styles.tooltipTitle}>{tooltipData.name}</div>

          {tooltipData.description && (
            <div className={styles.tooltipSection}>
              <div className={styles.tooltipSectionTitle}>
                {t("job-function-select.tooltip-description")}
              </div>
              <div className={styles.tooltipDescription}>{tooltipData.description}</div>
            </div>
          )}

          {tooltipData.arguments.length > 0 && (
            <div className={styles.tooltipSection}>
              <div className={styles.tooltipSectionTitle}>
                {t("job-function-select.tooltip-arguments")}
              </div>
              <div className={styles.tooltipArguments}>
                {tooltipData.arguments.map((argument) => (
                  <div key={argument.name} className={styles.tooltipArgument}>
                    <div className={styles.tooltipArgumentHead}>
                      <span className={styles.tooltipArgumentName}>{argument.name}</span>
                      {argument.required && (
                        <span className={styles.tooltipArgumentRequired}>*</span>
                      )}
                      {argument.type && (
                        <span className={styles.tooltipArgumentType}>{argument.type}</span>
                      )}
                    </div>
                    {argument.description && (
                      <div className={styles.tooltipArgumentDescription}>
                        {argument.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tooltipData.example && (
            <div className={styles.tooltipSection}>
              <div className={styles.tooltipSectionTitle}>
                {t("job-function-select.tooltip-example")}
              </div>
              <pre className={styles.tooltipExample}>{tooltipData.example}</pre>
            </div>
          )}
        </div>
      );
    },
    [functionTooltips, functionTooltipsLoading, t]
  );

  const columns = useMemo<ColumnsType<ModuleRow>>(
    () => [
      {
        title: t("job-function-select.table-module"),
        dataIndex: "moduleName",
        key: "moduleName",
        width: "35%",
        render: (_, moduleRow) => {
          return (
            <div className={styles.moduleCell}>
              <span className={styles.moduleTitle}>{moduleRow.moduleName}</span>
              <span className={styles.moduleDescription}>{moduleRow.description}</span>
            </div>
          );
        },
      },
      {
        title: t("job-function-select.table-functions"),
        dataIndex: "functions",
        key: "functions",
        render: (_, moduleRow) => {
          return (
            <div className={styles.functionsCell}>
              {moduleRow.functions.map((functionName) => (
                <Tooltip
                  key={`${functionName}-${tooltipResetCounter}`}
                  title={renderFunctionTooltip(functionName)}
                  mouseEnterDelay={0.45}
                  onOpenChange={(isOpen) => {
                    if (isOpen) {
                      handleFunctionHover(functionName);
                    }
                  }}
                  classNames={{ root: styles.tooltip }}
                  destroyOnHidden
                >
                  <Button
                    size="small"
                    className={styles.functionButton}
                    onClick={() => {
                      setTooltipResetCounter((prevState) => prevState + 1);
                      onSelect(functionName);
                    }}
                  >
                    {getFunctionDisplayName(functionName)}
                  </Button>
                </Tooltip>
              ))}
            </div>
          );
        },
      },
    ],
    [handleFunctionHover, onSelect, renderFunctionTooltip, t, tooltipResetCounter]
  );

  return (
    <Modal
      title={t("job-function-select.title")}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Flex vertical gap="middle">
        <SearchInput
          placeholder={t("job-function-select.search-placeholder")}
          autoFocus={open}
          onSearch={setAppliedSearchQuery}
        />

        <div className={styles.modalContent}>
          {isLoading && (
            <div className={styles.spinnerContainer}>
              <Spin />
            </div>
          )}

          {!isLoading && isError && (
            <Alert type="error" message={t("job-function-select.error")} showIcon />
          )}

          {hasNoData && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("job-function-select.empty")}
            />
          )}

          {hasNoResults && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("job-function-select.nothing-found")}
            />
          )}

          {shouldShowTable && (
            <Table
              className={styles.functionsTable}
              columns={columns}
              dataSource={filteredRows}
              pagination={false}
              size="small"
            />
          )}
        </div>
      </Flex>
    </Modal>
  );
};
