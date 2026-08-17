import { TEMPLATE_FILE_NAME_PATTERN } from "../constants/template-file-name";

export const getTemplateFileNameErrorKey = (rawFileName: string): string | null => {
  const trimmed = rawFileName.trim();
  if (trimmed.length === 0) {
    return "task-template-editor.file-name-required";
  }

  if (trimmed.startsWith("-")) {
    return "task-template-editor.file-name-invalid-leading-hyphen";
  }

  if (!TEMPLATE_FILE_NAME_PATTERN.test(trimmed)) {
    return "task-template-editor.file-name-invalid-characters";
  }

  return null;
};

export const isValidTemplateFileName = (rawFileName: string): boolean =>
  getTemplateFileNameErrorKey(rawFileName) === null;
