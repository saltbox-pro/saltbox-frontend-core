import { JobResult, TaskMinion } from "@saltbox/saltbox-core-api-client";
import { Drawer } from "antd";
import { observer } from "mobx-react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";

type MinionViewProps = {
  selectedMinion: TaskMinion;
  selectedMinionJobs: JobResult[];
  onClose: () => void;
};

type JobReturnViewProps = {
  jobReturn: JobResult;
};

type JobReturnItem = {
  __run_num__?: number;
  [key: string]: any;
};

const JobReturnView = ({ jobReturn }: JobReturnViewProps) => {
  const jobReturnData: Array<JobReturnItem | string> = [];
  if (Array.isArray(jobReturn)) {
    jobReturnData.push(...jobReturn);
  } else if (Object.keys(jobReturn).length > 0) {
    jobReturnData.push(...Object.values(jobReturn))
    jobReturnData?.sort((a, b) => (b as JobReturnItem)?.__run_num__ - (a as JobReturnItem)?.__run_num__);
  }

  return <ReactJson
    displayDataTypes={false}
    enableClipboard={false}
    name={false}
    displayObjectSize={false}
    src={jobReturnData ?? {}}
  />
};

export const MinionView = observer(({
  selectedMinion,
  selectedMinionJobs,
  onClose
}: MinionViewProps) => {
  const { t } = useTranslation();
  return (
    <Drawer
      open={selectedMinion !== undefined}
      onClose={onClose}
      mask={false}
      title={t("task.minion.title")}
      width="40%"
    >
      {selectedMinionJobs.map(jobResult => (
        <div key={jobResult.jid}>
          <div>{jobResult.jid}</div>
          <div>
            <JobReturnView jobReturn={jobResult?._return ?? {}} />
          </div>
        </div>
      ))}
    </Drawer>
  );
});
