import {
  SaltBoxAutocompleteValueEditor,
  SaltBoxMinionValueEditor,
} from "@saltbox/saltbox-frontend-common";
import { ComponentProps, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { retcodeValues } from "saltbox-core/shared/conf/retcode-values";
import { JobStore } from "saltbox-core/store";

type AutoCompleteProps = ComponentProps<typeof SaltBoxAutocompleteValueEditor>;
type MinionValueEditorProps = ComponentProps<typeof SaltBoxMinionValueEditor>;

const CoreJobReturnValueEditorComponent = ({
  jobStore,
  ...props
}: MinionValueEditorProps & { jobStore?: JobStore }) => {
  const { t } = useTranslation();
  const uniqueValues = useMemo(() => {
    if (!jobStore?.jobReturns || jobStore.jobReturns.length === 0) {
      return { jid: [], fun: [] };
    }

    const jidSet = new Set<string>();
    const funSet = new Set<string>();

    jobStore.jobReturns.forEach((jobReturn) => {
      if (jobReturn.jid) {
        jidSet.add(String(jobReturn.jid));
      }
      if (jobReturn.fun) {
        funSet.add(String(jobReturn.fun));
      }
    });

    return {
      jid: Array.from(jidSet).sort(),
      fun: Array.from(funSet).sort(),
    };
  }, [jobStore?.jobReturns]);

  const handleValueChange = useCallback<AutoCompleteProps["onValueChange"]>(
    (setOptions) => {
      if (props.field === "retcode") {
        setOptions([
          { value: retcodeValues.yes, label: t("minions.efi-yes") },
          { value: retcodeValues.no, label: t("minions.efi-no") },
        ]);
        return;
      }

      if (props.field === "jid") {
        const searchValue = String(props.value || "").toLowerCase();
        const filtered = uniqueValues.jid.filter((jid) => jid.toLowerCase().includes(searchValue));
        setOptions(filtered.map((jid) => ({ value: jid })));
        return;
      }

      if (props.field === "fun") {
        const searchValue = String(props.value || "").toLowerCase();
        const filtered = uniqueValues.fun.filter((fun) => fun.toLowerCase().includes(searchValue));
        setOptions(filtered.map((fun) => ({ value: fun })));
        return;
      }

      setOptions([]);
    },
    [props.field, props.value, uniqueValues, t]
  );

  return <SaltBoxMinionValueEditor onValueChange={handleValueChange} {...props} />;
};

export const CoreJobReturnValueEditor =
  (jobStore?: JobStore) => (props: MinionValueEditorProps) => {
    return <CoreJobReturnValueEditorComponent jobStore={jobStore} {...props} />;
  };
