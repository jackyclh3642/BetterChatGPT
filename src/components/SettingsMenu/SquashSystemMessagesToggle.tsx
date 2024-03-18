import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const SquashSystemMessagesToggle = () => {
  // const { t } = useTranslation();

  const setSquashSystemMessages = useStore((state) => state.setSquashSystemMessages);

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().squashSystemMessages
  );

  useEffect(() => {
    setSquashSystemMessages(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={"Squash System" as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default SquashSystemMessagesToggle;
