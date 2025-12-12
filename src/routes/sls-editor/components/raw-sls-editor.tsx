import Editor from "@monaco-editor/react";
import React from "react";

import styles from "./raw-sls-editor.module.css";

export interface RawSlsEditorProps {
  /**
   * Complete SLS content with embedded schema
   */
  sls: string;
  /**
   * Callback when SLS content changes
   */
  onSlsChange?: (newSls: string) => void;
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * RawSlsEditor - Monaco editor for editing raw SLS content
 *
 * This component provides a Monaco editor for editing the complete SLS file,
 * including the schema block. It's useful for advanced users who want to
 * manually edit the raw YAML/Jinja2 content.
 *
 * Features:
 * - YAML syntax highlighting
 * - Full SLS content editing (schema + body)
 * - Monaco editor with standard features (minimap, word wrap, etc.)
 *
 * @example
 * ```tsx
 * <RawSlsEditor
 *   sls={slsContent}
 *   onSlsChange={(newSls) => setSlsContent(newSls)}
 * />
 * ```
 */
export const RawSlsEditor: React.FC<RawSlsEditorProps> = ({ sls, onSlsChange, className }) => {
  const handleChange = (value: string | undefined) => {
    if (value !== undefined && onSlsChange) {
      onSlsChange(value);
    }
  };

  return (
    <div className={`${styles.rawSlsEditor} ${className || ""}`}>
      <Editor
        height="100%"
        language="yaml"
        value={sls}
        onChange={handleChange}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          tabSize: 2,
          insertSpaces: true,
          contextmenu: true,
          automaticLayout: true,
          readOnly: false,
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
};
