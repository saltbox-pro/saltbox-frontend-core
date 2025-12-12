import { Result, Button } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Result
      status="404"
      title="404"
      subTitle={t("base.not-found")}
      extra={
        <Link to="/minions">
          <Button type="primary">{t("base.back-home")}</Button>
        </Link>
      }
    />
  );
};

export default NotFound;
