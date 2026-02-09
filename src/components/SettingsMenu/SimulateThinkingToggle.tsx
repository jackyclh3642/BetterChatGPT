import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const SimulateThinkingToggle = () => {
  // const { t } = useTranslation();

  const setSimulateThinking = useStore((state) => state.setSimulateThinking);

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().simulateThinking
  );

  useEffect(() => {
    setSimulateThinking(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={"Simulate Thinking" as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default SimulateThinkingToggle;
