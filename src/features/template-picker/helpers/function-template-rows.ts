import {
  normalizeSearch,
  templateMatchesQuery,
  textIncludesQuery,
} from "saltbox-core/features/template-source-search";

import type { TaskTemplatePickerItem } from "../type/types";

import { compareTemplatesByAccessibilityThenTitle } from "./sort-picker-templates";
import { getFunctionDisplayName, getFunctionModuleName, isFunctionTemplate } from "./template-kind";
import type { TemplateSourceRow } from "./template-picker-rows";

export type FunctionTemplateItem = {
  key: string;
  fun: string;
  displayName: string;
  template: TaskTemplatePickerItem;
};

export type FunctionModuleRow = {
  key: string;
  moduleName: string;
  description: string;
  functions: FunctionTemplateItem[];
};

export type GetModuleDescription = (moduleName: string) => string;

const collectFunctionTemplates = (sourceRows: TemplateSourceRow[]): TaskTemplatePickerItem[] =>
  sourceRows.flatMap((sourceRow) => sourceRow.templates.filter(isFunctionTemplate));

const pickRepresentativeTemplates = (
  templates: TaskTemplatePickerItem[],
  language: string
): Map<string, TaskTemplatePickerItem> => {
  const byFun = new Map<string, TaskTemplatePickerItem>();

  templates.forEach((template) => {
    const current = byFun.get(template.fun);

    if (!current || compareTemplatesByAccessibilityThenTitle(template, current, language) < 0) {
      byFun.set(template.fun, template);
    }
  });

  return byFun;
};

export const buildFunctionModuleRows = (
  sourceRows: TemplateSourceRow[],
  language: string,
  getModuleDescription: GetModuleDescription
): FunctionModuleRow[] => {
  const representatives = pickRepresentativeTemplates(
    collectFunctionTemplates(sourceRows),
    language
  );

  const byModule = new Map<string, FunctionTemplateItem[]>();

  representatives.forEach((template, fun) => {
    const moduleName = getFunctionModuleName(fun);
    if (!moduleName) {
      return;
    }

    const moduleFunctions = byModule.get(moduleName) ?? [];
    moduleFunctions.push({
      key: fun,
      fun,
      displayName: getFunctionDisplayName(fun),
      template,
    });
    byModule.set(moduleName, moduleFunctions);
  });

  return Array.from(byModule.entries())
    .map(([moduleName, functions]) => ({
      key: moduleName,
      moduleName,
      description: getModuleDescription(moduleName),
      functions: functions.sort((first, second) => first.fun.localeCompare(second.fun)),
    }))
    .sort((first, second) => first.moduleName.localeCompare(second.moduleName));
};

export const filterFunctionModuleRows = (
  moduleRows: FunctionModuleRow[],
  appliedSearchQuery: string,
  language: string
): FunctionModuleRow[] => {
  const query = normalizeSearch(appliedSearchQuery);
  if (!query) {
    return moduleRows;
  }

  return moduleRows.reduce<FunctionModuleRow[]>((result, moduleRow) => {
    if (
      textIncludesQuery(moduleRow.moduleName, query) ||
      textIncludesQuery(moduleRow.description, query)
    ) {
      result.push(moduleRow);
      return result;
    }

    const functions = moduleRow.functions.filter((functionItem) =>
      templateMatchesQuery(functionItem.template, query, language)
    );

    if (functions.length > 0) {
      result.push({ ...moduleRow, functions });
    }

    return result;
  }, []);
};

export const getFunctionNamesLower = (moduleRows: FunctionModuleRow[]): Set<string> => {
  const names = new Set<string>();

  moduleRows.forEach((moduleRow) => {
    moduleRow.functions.forEach((functionItem) => names.add(functionItem.fun.toLowerCase()));
  });

  return names;
};
