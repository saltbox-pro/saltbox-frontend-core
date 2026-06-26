import {
  TEMPLATE_FILE_NAME_SEGMENT_PATTERN,
  TEMPLATE_FILE_NAME_SEGMENT_START_PATTERN,
} from "../constants/template-file-name";
import { stripSlsExtension } from "../lib/sls-parser";

export const getTemplateFileNameErrorKey = (rawFileName: string): string | null => {
  const normalized = stripSlsExtension(rawFileName);
  if (normalized.length === 0) {
    return "task-template-editor.file-name-required";
  }

  for (const name of normalized.split(",")) {
    for (const segment of name.split(".")) {
      if (segment.length === 0) {
        return "task-template-editor.file-name-invalid-empty-segment";
      }
      if (/\s/.test(segment)) {
        return "task-template-editor.file-name-invalid-spaces";
      }
      if (!TEMPLATE_FILE_NAME_SEGMENT_START_PATTERN.test(segment)) {
        return "task-template-editor.file-name-invalid-segment-start";
      }
      if (!TEMPLATE_FILE_NAME_SEGMENT_PATTERN.test(segment)) {
        return "task-template-editor.file-name-invalid-characters";
      }
    }
  }

  return null;
};

export const isValidTemplateFileName = (rawFileName: string): boolean =>
  getTemplateFileNameErrorKey(rawFileName) === null;
