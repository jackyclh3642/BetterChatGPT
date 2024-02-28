import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const SuffixJailbreakToggle = () => {
  // const { t } = useTranslation();

  const setSuffixJailbreak = useStore((state) => state.setSuffixJailbreak);
  // const setSystemJailbreak = useStore((state) => state.setSystemJailbreak);

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().suffixJailbreak
  );

  useEffect(() => {
    setSuffixJailbreak(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={"Suffix Jailbreak" as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default SuffixJailbreakToggle;
