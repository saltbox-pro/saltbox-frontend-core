import Editor from "@monaco-editor/react";

import styles from "./full-template-editor.module.css";

interface FullTemplateEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onMount?: () => void;
}

export function FullTemplateEditor({
  value,
  onChange,
  readOnly = false,
  onMount,
}: FullTemplateEditorProps) {
  return (
    <div className={styles.container}>
      <Editor
        height="100%"
        language="yaml"
        value={value}
        onChange={readOnly ? undefined : (next) => onChange?.(next ?? "")}
        onMount={() => onMount?.()}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          tabSize: 2,
          insertSpaces: true,
          contextmenu: !readOnly,
          automaticLayout: true,
          readOnly,
        }}
        wrapperProps={{
          style: {
            display: "flex",
            position: "relative",
            textAlign: "initial",
            width: "100%",
            height: "100%",
            flex: 1,
          },
        }}
      />
    </div>
  );
}
