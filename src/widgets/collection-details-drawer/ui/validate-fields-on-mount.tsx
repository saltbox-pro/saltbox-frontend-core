import type { FormInstance } from "antd";
import { useEffect } from "react";

interface ValidateFieldsOnMountProps<T> {
  form: FormInstance<T>;
  names: readonly (keyof T & string)[];
}

export function ValidateFieldsOnMount<T>({ form, names }: ValidateFieldsOnMountProps<T>) {
  useEffect(() => {
    form.validateFields([...names]).catch(() => undefined);
  }, [form, names]);

  return null;
}
