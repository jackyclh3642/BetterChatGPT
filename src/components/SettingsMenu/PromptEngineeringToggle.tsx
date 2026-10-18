import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const PromptEngineeringToggle = () => {
  const { t } = useTranslation();

  const setPromptEngineeringEnabled = useStore(
    (state) => state.setPromptEngineeringEnabled
  );

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().promptEngineeringEnabled
  );

  useEffect(() => {
    setPromptEngineeringEnabled(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={t('promptEngineering') as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default PromptEngineeringToggle;
