import Editor, { type OnMount } from "@monaco-editor/react";

import styles from "./full-template-editor.module.css";

interface FullTemplateEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onMount?: OnMount;
  language?: string;
  /** Путь модели: по нему monaco сопоставляет JSON-схему для подсказок. */
  path?: string;
}

export function FullTemplateEditor({
  value,
  onChange,
  readOnly = false,
  onMount,
  language = "yaml",
  path,
}: FullTemplateEditorProps) {
  return (
    <div className={styles.container}>
      <Editor
        height="100%"
        language={language}
        path={path}
        value={value}
        onChange={readOnly ? undefined : (next) => onChange?.(next ?? "")}
        onMount={onMount}
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
