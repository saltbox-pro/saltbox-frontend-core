import type { FormRule } from "antd";
import type { TFunction } from "i18next";

import { getTemplateFileNameErrorKey } from "./validate-template-file-name";

export const getTemplateFileNameRules = (t: TFunction): FormRule[] => [
  {
    validator: (_, value) => {
      const errorKey = getTemplateFileNameErrorKey(typeof value === "string" ? value : "");
      if (errorKey === null) {
        return Promise.resolve();
      }

      return Promise.reject(new Error(t(errorKey)));
    },
  },
];
