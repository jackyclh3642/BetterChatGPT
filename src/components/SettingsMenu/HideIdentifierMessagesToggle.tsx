import React, { useEffect, useState } from 'react';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const HideIdentifierMessagesToggle = () => {
  const setHideIdentifierMessages = useStore(
    (state) => state.setHideIdentifierMessages
  );

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().hideIdentifierMessages
  );

  useEffect(() => {
    setHideIdentifierMessages(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={'Hide Identifier Messages'}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default HideIdentifierMessagesToggle;
