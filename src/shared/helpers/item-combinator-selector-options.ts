import { isItemCombinator } from "@saltbox/saltbox-frontend-common";
import type { CombinatorSelectorProps, FullOption, OptionGroup } from "react-querybuilder";

function isOptionGroup(
  option: FullOption | OptionGroup<FullOption>
): option is OptionGroup<FullOption> {
  return "options" in option && Array.isArray(option.options);
}

export function withDisabledItemCombinators(
  options: CombinatorSelectorProps["options"]
): CombinatorSelectorProps["options"] {
  return options.map((option) => {
    if (isOptionGroup(option)) {
      return {
        ...option,
        options: withDisabledItemCombinators(option.options) as FullOption[],
      };
    }

    const value = String(option.value ?? option.name);
    if (!isItemCombinator(value)) {
      return option;
    }

    return { ...option, disabled: true };
  });
}
