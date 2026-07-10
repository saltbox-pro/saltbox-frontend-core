type TaskiqSerializedError = {
  exc_type?: string;
  exc_module?: string;
  exc_message?: string | string[];
  message?: string;
};

const decodePythonBytesString = (value: string): string => {
  const trimmed = value.trim();
  const bytesMatch = /^b(['"])(.*)\1$/s.exec(trimmed);

  if (!bytesMatch) {
    return trimmed.replace(/\\n/g, "\n");
  }

  return bytesMatch[2].replace(/\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
};

const extractExcMessage = (error: TaskiqSerializedError): string | null => {
  if (!error.exc_message) {
    return null;
  }

  const parts = Array.isArray(error.exc_message) ? error.exc_message : [error.exc_message];
  const text = parts
    .map((part) => decodePythonBytesString(String(part)))
    .join("\n")
    .trim();

  return text || null;
};

export function formatBgTaskError(error: unknown, progressMeta?: string | null): string | null {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error === "object") {
    const serialized = error as TaskiqSerializedError;

    if (typeof serialized.message === "string" && serialized.message.trim()) {
      return serialized.message.trim();
    }

    const fromExcMessage = extractExcMessage(serialized);
    if (fromExcMessage) {
      return fromExcMessage;
    }

    if (typeof serialized.exc_type === "string" && serialized.exc_type.trim()) {
      return serialized.exc_type.trim();
    }
  }

  if (typeof progressMeta === "string" && progressMeta.trim()) {
    return progressMeta.trim();
  }

  return null;
}
