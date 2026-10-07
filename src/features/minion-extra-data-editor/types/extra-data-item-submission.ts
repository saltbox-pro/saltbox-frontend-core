import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import type { AppError } from "@saltbox/saltbox-frontend-common";

export type ExtraDataItemSubmission = {
  submit: (category: ExtraDataCategoryModel, data: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
  error: AppError | null;
  resetError: () => void;
};
