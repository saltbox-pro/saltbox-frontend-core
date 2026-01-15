const maxTableRows = 10000;
const maxTableColumns = 100;
const maxNestedDepth = 3;
const maxDisplayLength = 100;
const maxFilterOptions = 100;

export type TableRow = Record<string, unknown>;
export type TableData = {
  columns: string[];
  rows: TableRow[];
  canConvert: boolean;
  reason?: string;
  errors?: Array<{ minion_id: string; error: string }>;
};

export { maxDisplayLength, maxFilterOptions };

const isErrorData = (data: unknown): boolean => {
  if (typeof data === "string") {
    const errorPatterns = [
      /^ERROR\s+/i,
      /error\s+executing/i,
      /error:/i,
      /^exception/i,
      /^failed/i,
      /^traceback/i,
      /^invalid/i,
      /not valid/i,
      /not found/i,
      /^command not found/i,
      /^permission denied/i,
      /^access denied/i,
      /^no such file/i,
    ];
    return errorPatterns.some((pattern) => pattern.test(data));
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    return (
      obj.hasOwnProperty("error") ||
      obj.hasOwnProperty("exception") ||
      obj.hasOwnProperty("traceback") ||
      obj.hasOwnProperty("failed") ||
      (obj.hasOwnProperty("result") && obj.result === false)
    );
  }

  return false;
};

const flattenObject = (
  obj: unknown,
  prefix = "",
  maxDepth = maxNestedDepth,
  depth = 0
): Record<string, unknown> => {
  if (depth >= maxDepth) {
    return { [prefix || "value"]: JSON.stringify(obj) };
  }

  const flattened: Record<string, unknown> = {};

  if (obj === null || obj === undefined) {
    return { [prefix || "value"]: String(obj) };
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return { [prefix || "value"]: "[]" };
    }

    const firstItem = obj[0];
    if (typeof firstItem === "object" && firstItem !== null && !Array.isArray(firstItem)) {
      obj.forEach((item, index) => {
        const nested = flattenObject(
          item,
          prefix ? `${prefix}[${index}]` : `[${index}]`,
          maxDepth,
          depth + 1
        );
        Object.assign(flattened, nested);
      });
    } else {
      flattened[prefix || "value"] = obj
        .map((v) => {
          if (v === null || v === undefined) return String(v);
          if (typeof v === "object") return JSON.stringify(v);
          return String(v);
        })
        .join(", ");
    }
  } else if (typeof obj === "object") {
    Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      const nested = flattenObject(value, newPrefix, maxDepth, depth + 1);
      Object.assign(flattened, nested);
    });
  } else {
    flattened[prefix || "value"] = String(obj);
  }

  return flattened;
};

const isPrimitive = (value: unknown): boolean => {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const countRows = (data: unknown, depth = 0): number => {
  if (depth > maxNestedDepth) {
    return 1;
  }

  if (Array.isArray(data)) {
    return data.reduce((sum, item) => sum + countRows(item, depth + 1), 0);
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Object.values(obj).every((v) => typeof v === "object" && v !== null && !Array.isArray(v))) {
      return Object.keys(obj).length;
    }
    return 1;
  }

  return 1;
};

const collectKeys = (data: unknown, depth = 0, maxDepth = maxNestedDepth): Set<string> => {
  const keys = new Set<string>();

  if (depth > maxDepth) {
    return keys;
  }

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        Object.keys(item).forEach((key) => keys.add(key));
        Object.values(item).forEach((value) => {
          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            collectKeys(value, depth + 1, maxDepth).forEach((k) => keys.add(k));
          }
        });
      }
    });
  } else if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    Object.keys(obj).forEach((key) => keys.add(key));
    Object.values(obj).forEach((value) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        collectKeys(value, depth + 1, maxDepth).forEach((k) => keys.add(k));
      }
    });
  }

  return keys;
};

const convertDictOfDicts = (data: Record<string, unknown>, minionId: string): TableData => {
  const rows: TableRow[] = [];
  const allKeys = new Set<string>();

  Object.values(data).forEach((value) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.keys(value as Record<string, unknown>).forEach((key) => allKeys.add(key));
    }
  });

  const columns = ["minion_id", "dict_key", ...Array.from(allKeys).sort()];

  if (columns.length > maxTableColumns) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many columns: ${columns.length} > ${maxTableColumns}`,
    };
  }

  if (Object.keys(data).length > maxTableRows) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many rows: ${Object.keys(data).length} > ${maxTableRows}`,
    };
  }

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const rowKey = `${minionId}-${key}-${JSON.stringify(value).substring(0, 50)}`;
      const row: TableRow = {
        key: rowKey,
        minion_id: minionId,
        dict_key: key,
      };

      const nestedObj = value as Record<string, unknown>;
      columns.forEach((col) => {
        if (col !== "minion_id" && col !== "key" && col !== "dict_key") {
          const cellValue = nestedObj[col];
          if (isPrimitive(cellValue)) {
            row[col] = formatValue(cellValue);
          } else {
            row[col] = JSON.stringify(cellValue);
          }
        }
      });

      rows.push(row);
    }
  });

  return {
    columns,
    rows,
    canConvert: true,
  };
};

const convertSimpleValue = (data: string | number | boolean, minionId: string): TableData => {
  const rowKey = `${minionId}-${formatValue(data).substring(0, 50)}`;
  return {
    columns: ["minion_id", "value"],
    rows: [
      {
        key: rowKey,
        minion_id: minionId,
        value: formatValue(data),
      },
    ],
    canConvert: true,
  };
};

const convertSimpleList = (data: unknown[], minionId: string): TableData => {
  const rows: TableRow[] = [];

  if (data.length > maxTableRows) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many rows: ${data.length} > ${maxTableRows}`,
    };
  }

  data.forEach((item, index) => {
    const rowKey = `${minionId}-${index}-${formatValue(item).substring(0, 50)}`;
    rows.push({
      key: rowKey,
      minion_id: minionId,
      value: formatValue(item),
    });
  });

  return {
    columns: ["minion_id", "value"],
    rows,
    canConvert: true,
  };
};

const convertListOfObjects = (data: unknown[], minionId: string): TableData => {
  const rows: TableRow[] = [];
  const allKeys = new Set<string>();

  data.forEach((item) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      Object.keys(item as Record<string, unknown>).forEach((key) => allKeys.add(key));
    }
  });

  const columns = ["minion_id", ...Array.from(allKeys).sort()];

  if (columns.length > maxTableColumns) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many columns: ${columns.length} > ${maxTableColumns}`,
    };
  }

  if (data.length > maxTableRows) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many rows: ${data.length} > ${maxTableRows}`,
    };
  }

  data.forEach((item, index) => {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      const rowKey = `${minionId}-${index}-${JSON.stringify(item).substring(0, 50)}`;
      const row: TableRow = {
        key: rowKey,
        minion_id: minionId,
      };

      const obj = item as Record<string, unknown>;
      columns.forEach((col) => {
        if (col !== "minion_id" && col !== "key") {
          const cellValue = obj[col];
          if (isPrimitive(cellValue)) {
            row[col] = formatValue(cellValue);
          } else {
            row[col] = JSON.stringify(cellValue);
          }
        }
      });

      rows.push(row);
    }
  });

  return {
    columns,
    rows,
    canConvert: true,
  };
};

const convertSimpleObject = (data: Record<string, unknown>, minionId: string): TableData => {
  const columns = ["minion_id", ...Object.keys(data).sort()];

  if (columns.length > maxTableColumns) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many columns: ${columns.length} > ${maxTableColumns}`,
    };
  }

  const row: TableRow = {
    minion_id: minionId,
  };

  Object.entries(data).forEach(([key, value]) => {
    if (isPrimitive(value)) {
      row[key] = formatValue(value);
    } else {
      row[key] = JSON.stringify(value);
    }
  });

  const normalizedRow: TableRow = {};
  columns.forEach((col) => {
    normalizedRow[col] = row[col] ?? "";
  });

  return {
    columns,
    rows: [normalizedRow],
    canConvert: true,
  };
};

export const canConvertToTable = (data: unknown): boolean => {
  if (data === null || data === undefined) {
    return false;
  }

  if (isPrimitive(data)) {
    return true;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return false;
    }
    if (data.every((item) => isPrimitive(item))) {
      return countRows(data) <= maxTableRows;
    }
    if (data.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))) {
      return countRows(data) <= maxTableRows;
    }
    return false;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return false;
    }

    const allValuesAreObjects = Object.values(obj).every(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v)
    );
    if (allValuesAreObjects) {
      return countRows(data) <= maxTableRows;
    }

    return true;
  }

  return false;
};

export const convertToTable = (data: unknown, minionId: string): TableData => {
  if (!canConvertToTable(data)) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: "Data structure is not suitable for table conversion",
    };
  }

  if (isPrimitive(data) && data !== null && data !== undefined) {
    return convertSimpleValue(data as string | number | boolean, minionId);
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        columns: [],
        rows: [],
        canConvert: false,
        reason: "Empty array",
      };
    }

    if (data.every((item) => isPrimitive(item))) {
      return convertSimpleList(data, minionId);
    }

    if (data.every((item) => typeof item === "object" && item !== null && !Array.isArray(item))) {
      return convertListOfObjects(data, minionId);
    }

    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: "Mixed array types",
    };
  }

  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length === 0) {
      return {
        columns: [],
        rows: [],
        canConvert: false,
        reason: "Empty object",
      };
    }

    const allValuesAreObjects = Object.values(obj).every(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v)
    );
    if (allValuesAreObjects) {
      return convertDictOfDicts(obj, minionId);
    }

    return convertSimpleObject(obj, minionId);
  }

  return {
    columns: [],
    rows: [],
    canConvert: false,
    reason: "Unknown data type",
  };
};

const getDataType = (data: unknown): string => {
  if (data === null || data === undefined) {
    return "null";
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return "empty_array";
    }
    const firstItem = data[0];
    if (typeof firstItem === "object" && firstItem !== null && !Array.isArray(firstItem)) {
      return "array_of_objects";
    }
    return "array_of_values";
  }

  if (typeof data === "object") {
    const keys = Object.keys(data as Record<string, unknown>);
    if (keys.length === 0) {
      return "empty_object";
    }
    const firstValue = (data as Record<string, unknown>)[keys[0]];
    if (typeof firstValue === "object" && firstValue !== null && !Array.isArray(firstValue)) {
      return "dict_of_dicts";
    }
    return "simple_object";
  }

  return "simple_value";
};

export const mergeJobReturnsToTable = (
  jobReturns: Array<{ data: unknown; minion_id: string }>
): TableData => {
  const allRows: TableRow[] = [];
  const allColumns = new Set<string>(["minion_id"]);
  const errors: Array<{ minion_id: string; error: string }> = [];
  const conversionReasons: string[] = [];

  jobReturns.forEach((jobReturn) => {
    const dataToShow = jobReturn.data;
    const minionId = jobReturn.minion_id || "";

    if (!minionId || !jobReturn.hasOwnProperty("data")) {
      return;
    }

    if (isErrorData(dataToShow)) {
      errors.push({
        minion_id: minionId,
        error: typeof dataToShow === "string" ? dataToShow : JSON.stringify(dataToShow),
      });
      return;
    }

    if (!canConvertToTable(dataToShow)) {
      conversionReasons.push(`${minionId}: Data structure is not suitable for table conversion`);
      return;
    }

    const tableData = convertToTable(dataToShow, minionId);
    if (!tableData.canConvert) {
      conversionReasons.push(`${minionId}: ${tableData.reason || "Unknown reason"}`);
      return;
    }

    tableData.columns.forEach((col) => {
      if (col !== "minion_id" && col !== "key") {
        allColumns.add(col);
      }
    });

    tableData.rows.forEach((row) => {
      const rowKey = row.key || `${minionId}-${JSON.stringify(row).substring(0, 50)}`;
      const mergedRow: TableRow = {
        key: rowKey,
        minion_id: row.minion_id || minionId,
        ...row,
      };
      allRows.push(mergedRow);
    });
  });

  if (allRows.length === 0 && conversionReasons.length > 0) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason:
        conversionReasons.length === 1
          ? conversionReasons[0]
          : `Cannot convert data for ${conversionReasons.length} minion(s). First reason: ${conversionReasons[0]}`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  if (allRows.length === 0) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: "No data available for table conversion",
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  if (allColumns.size > maxTableColumns) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many columns: ${allColumns.size} > ${maxTableColumns}`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  if (allRows.length > maxTableRows) {
    return {
      columns: [],
      rows: [],
      canConvert: false,
      reason: `Too many rows: ${allRows.length} > ${maxTableRows}`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  if (allRows.length > 0) {
    allRows.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== "key" && k !== "minion_id") {
          allColumns.add(k);
        }
      });
    });
  }

  const sortedColumns = Array.from(allColumns).sort((a, b) => {
    if (a === "minion_id") return -1;
    if (b === "minion_id") return 1;
    if (a === "dict_key") return -1;
    if (b === "dict_key") return 1;
    return a.localeCompare(b);
  });

  const normalizedRows = allRows.map((row) => {
    const normalized: TableRow = {};
    sortedColumns.forEach((col) => {
      normalized[col] = row[col] ?? "";
    });
    if (row.key) {
      normalized.key = row.key;
    }
    return normalized;
  });

  return {
    columns: sortedColumns,
    rows: normalizedRows,
    canConvert: true,
    errors: errors.length > 0 ? errors : undefined,
  };
};

export const exportToCSV = (
  tableData: TableData,
  filename: string = "export.csv",
  sorting?: Array<{ id: string; desc: boolean }>,
  columns?: Array<{ id: string; accessorKey?: string }>
): void => {
  if (!tableData.canConvert || tableData.rows.length === 0) {
    return;
  }

  let rowsToExport = [...tableData.rows];

  if (sorting && sorting.length > 0 && columns) {
    rowsToExport.sort((a, b) => {
      for (const sort of sorting) {
        const column = columns.find((col) => col.id === sort.id || col.accessorKey === sort.id);
        if (!column) continue;

        const accessorKey = column.accessorKey || column.id;
        const aValue = a[accessorKey];
        const bValue = b[accessorKey];

        if (aValue === bValue) continue;

        const aStr = aValue == null ? "" : String(aValue);
        const bStr = bValue == null ? "" : String(bValue);

        const comparison = aStr.localeCompare(bStr, undefined, {
          numeric: true,
          sensitivity: "base",
        });

        if (comparison !== 0) {
          return sort.desc ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  const headers = tableData.columns;
  const csvRows: string[] = [headers.join(",")];

  rowsToExport.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] ?? "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
