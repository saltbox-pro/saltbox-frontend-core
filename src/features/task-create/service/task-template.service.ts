import { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import { TaskTemplateWithRepository, TemplateListFilterOptions } from "../type/types";

export class TaskTemplateService {
  async loadTemplates(): Promise<TaskTemplateWithRepository[]> {
    try {
      const response = await apiCoreStore.taskTemplatesApi?.taskTemplatesList();
      if (!response?.data) {
        return [];
      }

      return response.data.map((template) => ({
        ...template,
        repository: template.repo_info?.name,
      }));
    } catch (error) {
      console.error("Failed to load task templates:", error);
      throw new Error("Failed to load task templates");
    }
  }

  async loadTemplateById(templateId: string): Promise<TaskTemplateModel> {
    try {
      const response = await apiCoreStore.taskTemplatesApi?.taskTemplateRetrieve({
        tpl_id: templateId,
      });
      if (!response) {
        throw new Error("Template not found");
      }
      return response;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      throw new Error("Failed to load task template");
    }
  }

  filterTemplates(
    templates: TaskTemplateWithRepository[],
    filters: TemplateListFilterOptions
  ): TaskTemplateWithRepository[] {
    let filtered = [...templates];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((template) => {
        type TemplateKeys = Array<keyof typeof template>;
        return (["title", "name", "id"] satisfies TemplateKeys).some((field) =>
          template[field]?.toLowerCase().includes(query)
        );
      });
    }

    if (filters.repositoryFilter) {
      filtered = filtered.filter((template) => template.repository === filters.repositoryFilter);
    }

    return filtered;
  }

  getUniqueRepositories(templates: TaskTemplateWithRepository[]): string[] {
    const repositories = templates
      .map((template) => template.repository)
      .filter((repository) => Boolean(repository));
    return Array.from(new Set(repositories)).sort();
  }
}

export const taskTemplateService = new TaskTemplateService();
