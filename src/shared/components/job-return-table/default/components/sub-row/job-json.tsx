import { Flex } from "antd";
import ReactJson from "react-json-view";

import styles from "./job-json.module.css";

interface JobJsonProps {
  collapsed: number;
  jsonValue: object;
}

export function JobJson({ collapsed, jsonValue }: JobJsonProps) {
  return (
    <Flex vertical className={styles.jobJsonContainer}>
      <ReactJson
        displayDataTypes={false}
        enableClipboard={false}
        name={false}
        displayObjectSize={false}
        src={jsonValue}
        collapsed={collapsed}
      />
    </Flex>
  );
}
