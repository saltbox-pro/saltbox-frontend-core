import JsonForm from "@rjsf/antd";
import Form, { type FormProps } from "@rjsf/core";
import type { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import type { ComponentRef, Ref } from "react";

import { SaltboxArrayFieldItemTemplate } from "../templates/array-field-item-template";
import { SaltboxArrayFieldTemplate } from "../templates/array-field-template";

import styles from "./form.module.css";

export type SaltboxJsonFormRef = ComponentRef<typeof Form>;

export type SaltboxJsonFormProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Omit<FormProps<T, S, F>, "validator" | "ref"> & {
  validator?: FormProps<T, S, F>["validator"];
  ref?: Ref<SaltboxJsonFormRef>;
};

/**
 * TODO: В дальнейшем (после теста в рамках core) нужно вынести в common репозиторий и переиспользовать везде,
 * где используется форма от @rjsf/antd
 */
export const SaltboxJsonForm = <
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  showErrorList = false,
  validator: validatorProp,
  ref,
  className,
  templates,
  ...rest
}: SaltboxJsonFormProps<T, S, F>) => {
  return (
    <JsonForm
      ref={ref}
      className={`${styles.saltboxJsonForm} ${className || ""}`}
      validator={validatorProp ?? validator}
      showErrorList={showErrorList}
      templates={{
        ArrayFieldTemplate: SaltboxArrayFieldTemplate,
        ArrayFieldItemTemplate: SaltboxArrayFieldItemTemplate,
        ...templates,
      }}
      {...rest}
    />
  );
};
