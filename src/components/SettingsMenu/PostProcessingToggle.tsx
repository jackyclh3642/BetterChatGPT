import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import Toggle from '@components/Toggle';

const PostProcessingToggle = () => {
  const { t } = useTranslation();

  const setPostProcessingEnabled = useStore(
    (state) => state.setPostProcessingEnabled
  );

  const [isChecked, setIsChecked] = useState<boolean>(
    useStore.getState().postProcessingEnabled
  );

  useEffect(() => {
    setPostProcessingEnabled(isChecked);
  }, [isChecked]);

  return (
    <Toggle
      label={t('postProcessing') as string}
      isChecked={isChecked}
      setIsChecked={setIsChecked}
    />
  );
};

export default PostProcessingToggle;
