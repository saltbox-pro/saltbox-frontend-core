import { DownloadOutlined } from "@ant-design/icons";
import Editor from "@monaco-editor/react";
import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Button, Tooltip, Typography, message } from "antd";
import React, { useMemo } from "react";

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
 * - Header with filename and export buttons (download and copy to clipboard)
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

  // Extract filename from schema title
  const filename = useMemo(() => {
    if (!sls) return "state.sls";

    try {
      const schemaRegex = /{#start_schema\s*([\s\S]*?)\s*end_schema#}/;
      const match = sls.match(schemaRegex);

      if (match) {
        const schema = JSON.parse(match[1]);
        const title = schema?.json_schema?.title;

        if (title && typeof title === "string" && title.trim()) {
          return title.toLowerCase().replace(/\s+/g, "_") + ".sls";
        }
      }
    } catch (error) {
      console.warn("Failed to parse schema for filename:", error);
    }

    return "state.sls";
  }, [sls]);

  const handleDownload = () => {
    if (!sls) {
      message.warning("No content to download");
      return;
    }

    try {
      const blob = new Blob([sls], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success("SLS file downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download SLS file");
    }
  };

  return (
    <div className={`${styles.rawSlsEditor} ${className || ""}`}>
      <div className={styles.header}>
        <Typography.Text strong ellipsis>
          {filename}
        </Typography.Text>
        <Button.Group>
          <CopyToClipboardButton
            text={sls ?? ""}
            disabled={!sls}
            successMessage="SLS content copied to clipboard"
            errorMessage="Failed to copy to clipboard"
          />
          <Tooltip title="Download SLS">
            <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!sls} />
          </Tooltip>
        </Button.Group>
      </div>
      <div className={styles.editorContainer}>
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
    </div>
  );
};
