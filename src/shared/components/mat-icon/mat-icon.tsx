import "@material-symbols/font-300";
// eslint-disable-next-line no-duplicate-imports
import { MaterialSymbol } from "@material-symbols/font-300";

type IconSize = "small" | "normal" | "large";
type MatIconProps = {
  className?: string;
  icon: MaterialSymbol;
  size?: IconSize;
};

export function MatIcon({ className, icon, size }: MatIconProps) {
  const defaultClass = "material-symbols-outlined";
  const sizeClasses: { [key in IconSize]: string } = {
    small: "20px",
    normal: "24px",
    large: "32px",
  };
  const fontSize = size ? sizeClasses[size] : sizeClasses.normal;

  return (
    <>
      <span
        style={{ fontSize }}
        className={className ? className : defaultClass}
      >
        {icon}
      </span>
    </>
  );
}
