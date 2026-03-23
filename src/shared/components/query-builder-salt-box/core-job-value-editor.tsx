import {
  GetOptionsCallback,
  SaltBoxOptionsValueEditor,
  ValueEditorProps,
} from "@saltbox/saltbox-frontend-common";
import { FC, useMemo } from "react";

import { JobsStore } from "saltbox-core/store";

type CoreJobValueEditorInnerProps = ValueEditorProps & { jobsStore?: JobsStore };

const getOptionsFromJobsStore = (jobsStore?: JobsStore): GetOptionsCallback => {
  return (field, value, setOptions) => {
    if (!jobsStore?.jobs?.length) {
      setOptions([]);
      return;
    }
    const search = String(value ?? "").toLowerCase();
    if (field === "jid") {
      const jids = [...new Set(jobsStore.jobs.map((j) => j.jid).filter(Boolean))].sort();
      const filtered = search
        ? jids.filter((jid) => String(jid).toLowerCase().includes(search))
        : jids;
      setOptions(filtered.map((jid) => ({ value: String(jid) })));
      return;
    }
    if (field === "fun") {
      const funs = [...new Set(jobsStore.jobs.map((j) => j.fun).filter(Boolean))].sort();
      const filtered = search ? funs.filter((f) => String(f).toLowerCase().includes(search)) : funs;
      setOptions(filtered.map((f) => ({ value: String(f) })));
      return;
    }
    if (field === "user.name") {
      const names = [
        ...new Set(jobsStore.jobs.map((j) => j.user?.name).filter((n): n is string => Boolean(n))),
      ].sort();
      const filtered = search ? names.filter((n) => n.toLowerCase().includes(search)) : names;
      setOptions(filtered.map((n) => ({ value: n })));
      return;
    }
    setOptions([]);
  };
};

const CoreJobValueEditorInner: FC<CoreJobValueEditorInnerProps> = ({ jobsStore, ...props }) => {
  const getOptions = useMemo(() => getOptionsFromJobsStore(jobsStore), [jobsStore]);
  return <SaltBoxOptionsValueEditor getOptions={getOptions} {...props} />;
};

export const CoreJobValueEditor =
  (jobsStore?: JobsStore): FC<ValueEditorProps> =>
  (props) => <CoreJobValueEditorInner jobsStore={jobsStore} {...props} />;
