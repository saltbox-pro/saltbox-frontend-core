import { ValueEditorProps } from "react-querybuilder";

export const SaltBoxReadonlyValueEditor = (props: ValueEditorProps) => {
  return (
    <span>
      {props.value === undefined || props.value === null
        ? ""
        : String(props.value)}
    </span>
  );
};
