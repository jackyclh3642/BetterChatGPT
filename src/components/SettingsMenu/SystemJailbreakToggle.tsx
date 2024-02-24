import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const SystemJailbreakToggle = () => {
  // const { t } = useTranslation();

  const setSystemJailbreak = useStore((state) => state.setSystemJailbreak);

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().systemJailbreak
  );

  useEffect(() => {
    setSystemJailbreak(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={"System Jailbreak" as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default SystemJailbreakToggle;
