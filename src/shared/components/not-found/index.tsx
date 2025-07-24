import React from 'react';
import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

const NotFound: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleBackHome = () => {
        navigate('/');
    };

    return (
        <Result
            status="404"
            title="404"
            subTitle={t('base:not-found')}
            extra={
                <Button type="primary" onClick={handleBackHome}>
                    {t('base:back-home')}
                </Button>
            }
        />
    );
};

export default NotFound; 