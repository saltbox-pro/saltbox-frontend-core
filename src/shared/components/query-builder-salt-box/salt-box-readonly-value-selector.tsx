import { ValueSelectorProps } from "react-querybuilder";

export const SaltBoxReadonlyValueSelector = (props: ValueSelectorProps) => {
  // @ts-ignore
  const selected = props.options?.find((opt) => opt.value === props.value);

  if (
    !selected &&
    typeof props.value === "string" &&
    props.value.startsWith("grains.")
  ) {
    const grainName = props.value.replace("grains.", "");
    return (
      <span>
        Custom grains: <span style={{ fontWeight: 700 }}>{grainName}</span>
      </span>
    );
  }

  return <span>{selected ? selected.label : String(props.value)}</span>;
};
