import { ExportOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { Link } from "react-router";

interface InfoDrawerLinkProps {
  to?: string;
  title?: string;
}

export function InfoDrawerLink({ to, title }: InfoDrawerLinkProps) {
  if (!to) {
    return null;
  }

  return (
    <Link to={to}>
      <Button
        color="default"
        variant="outlined"
        size="small"
        icon={<ExportOutlined />}
        title={title}
      />
    </Link>
  );
}
