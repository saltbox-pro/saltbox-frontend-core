import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";

import {
  type UseTemplateItemActionsOptions,
  useTemplateItemActions,
} from "../hooks/use-template-item-actions";

import { TemplateItemActionsButtons } from "./template-item-actions-buttons";

export type TemplateItemActionsProps = UseTemplateItemActionsOptions & {
  stopPropagation?: boolean;
};

export function TemplateItemActions({
  stopPropagation = false,
  ...options
}: TemplateItemActionsProps) {
  const { isDeleting, handleEdit, handleDuplicate, handleDeleteClick } =
    useTemplateItemActions(options);

  return (
    <TemplateItemActionsButtons
      permissions={options.permissions}
      showDelete={Boolean(options.onDeleteTemplate)}
      isDeleting={isDeleting}
      isDeleteBlocked={options.isDeleteBlocked}
      stopPropagation={stopPropagation}
      onEdit={handleEdit}
      onDuplicate={handleDuplicate}
      onDelete={handleDeleteClick}
    />
  );
}

export type TemplateItemActionsGuardedProps = Omit<
  TemplateItemActionsProps,
  "template" | "permissions"
> & {
  template: TaskTemplatePublicSchema | null;
  permissions: TemplateItemActionsProps["permissions"] | null;
};

export function TemplateItemActionsGuarded({
  template,
  permissions,
  ...props
}: TemplateItemActionsGuardedProps) {
  if (!template || !permissions) {
    return null;
  }

  return <TemplateItemActions template={template} permissions={permissions} {...props} />;
}
