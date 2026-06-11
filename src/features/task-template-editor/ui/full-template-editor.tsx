import Editor from "@monaco-editor/react";

import styles from "./full-template-editor.module.css";

interface FullTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function FullTemplateEditor({ value, onChange }: FullTemplateEditorProps) {
  return (
    <div className={styles.container}>
      <Editor
        height="100%"
        language="yaml"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          tabSize: 2,
          insertSpaces: true,
          contextmenu: true,
          automaticLayout: true,
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
