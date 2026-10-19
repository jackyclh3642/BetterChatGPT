import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '@store/store';

import downloadFile from '@utils/downloadFile';
import { getToday } from '@utils/date';
import { encryptWithPassword } from '@utils/crypto';

import Export from '@type/export';

const ExportChat = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  const handleExport = async () => {
    const state = useStore.getState();
    const fileData: Export = {
      chats: state.chats,
      folders: state.folders,
      version: 1,
      promptEngineeringScript: state.promptEngineeringScript,
      postProcessingScript: state.postProcessingScript,
    };

    let payload: object = fileData;
    let filename = getToday() + '.json';

    if (password.trim()) {
      // Include API settings for password-protected exports
      payload = {
        ...fileData,
        apiEndpoint: state.apiEndpoint,
        apiKey: state.apiKey,
        additionalBodyParameters: state.additionalBodyParameters,
      };

      const encrypted = await encryptWithPassword(
        JSON.stringify(payload),
        password.trim()
      );
      payload = {
        version: 'encrypted',
        ...encrypted,
      };
      filename = getToday() + '_p.json';
    }

    downloadFile(payload, filename);
  };

  return (
    <div className='mt-6'>
      <div className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
        {t('export')} (JSON)
      </div>
      <input
        type='password'
        className='w-full text-sm p-2 mb-2 text-gray-800 dark:text-gray-300 rounded-md focus:outline-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400'
        placeholder='Password (optional) — enables encryption & API settings'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className='btn btn-small btn-primary'
        onClick={handleExport}
        aria-label={t('export') as string}
      >
        {t('export')}
      </button>
    </div>
  );
};
export default ExportChat;
