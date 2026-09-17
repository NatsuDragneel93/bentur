import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CategoryListPage from '../../../components/category-list/CategoryListPage';
import { inventoryItemType } from '../../../components/category-list/itemTypes';
import { useRequiredUser } from '../../../hooks/useAuth';
import myInventoryPersonalService from '../../../services/myInventoryPersonal.service';

const MyInventoryPersonal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useRequiredUser();
  const service = useMemo(() => myInventoryPersonalService.forUser(user.uid), [user.uid]);

  const labels = {
    pageTitle: t('inventoryPersonal.title'),
    addItem: t('inventoryPersonal.addItem'),
    editItem: t('inventoryPersonal.editItem'),
    deleteItemConfirm: t('inventoryPersonal.deleteItemConfirm'),
    emptyCategory: t('inventoryPersonal.emptyCategory'),
  };

  return (
    <CategoryListPage
      service={service}
      itemType={inventoryItemType}
      labels={labels}
      back={{ label: t('nav.inventory'), onClick: () => navigate('/my-inventory') }}
    />
  );
};

export default MyInventoryPersonal;
