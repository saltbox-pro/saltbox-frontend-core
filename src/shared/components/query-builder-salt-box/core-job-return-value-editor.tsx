import {
  GetOptionsCallback,
  SaltBoxOptionsValueEditor,
  ValueEditorProps,
} from "@saltbox/saltbox-frontend-common";
import { FC, useMemo } from "react";

import { JobStore } from "saltbox-core/store";

type CoreJobReturnValueEditorInnerProps = ValueEditorProps & {
  jobStore?: JobStore;
};

const createGetOptions = (jobStore?: JobStore): GetOptionsCallback => {
  return (field, value, setOptions) => {
    if (!jobStore?.jobReturns?.length) {
      setOptions([]);
      return;
    }

    const search = String(value ?? "").toLowerCase();
    if (field === "jid") {
      const jids = [
        ...new Set(jobStore.jobReturns.map((r) => r.jid).filter((j): j is string => Boolean(j))),
      ].sort();
      const filtered = search ? jids.filter((jid) => jid.toLowerCase().includes(search)) : jids;
      setOptions(filtered.map((jid) => ({ value: jid })));
      return;
    }
    if (field === "fun") {
      const funs = [
        ...new Set(jobStore.jobReturns.map((r) => r.fun).filter((f): f is string => Boolean(f))),
      ].sort();
      const filtered = search ? funs.filter((f) => f.toLowerCase().includes(search)) : funs;
      setOptions(filtered.map((f) => ({ value: f })));
      return;
    }
    setOptions([]);
  };
};

const CoreJobReturnValueEditorInner: FC<CoreJobReturnValueEditorInnerProps> = ({
  jobStore,
  ...props
}) => {
  const getOptions = useMemo(() => createGetOptions(jobStore), [jobStore]);
  return <SaltBoxOptionsValueEditor getOptions={getOptions} {...props} />;
};

export const CoreJobReturnValueEditor =
  (jobStore?: JobStore): FC<ValueEditorProps> =>
  (props) => <CoreJobReturnValueEditorInner jobStore={jobStore} {...props} />;
