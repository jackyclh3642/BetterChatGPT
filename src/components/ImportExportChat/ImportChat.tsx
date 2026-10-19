import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import useStore from '@store/store';

import {
  isLegacyImport,
  validateExportV1,
} from '@utils/import';
import { decryptWithPassword } from '@utils/crypto';

import { ChatInterface } from '@type/chat';
import { ExportBase } from '@type/export';

const ImportChat = () => {
  const { t } = useTranslation();
  const setChats = useStore.getState().setChats;
  const setFolders = useStore.getState().setFolders;
  const setApiKey = useStore.getState().setApiKey;
  const setApiEndpoint = useStore.getState().setApiEndpoint;
  const setAdditionalBodyParameters =
    useStore.getState().setAdditionalBodyParameters;
  const setPromptEngineeringScript =
    useStore.getState().setPromptEngineeringScript;
  const setPostProcessingScript =
    useStore.getState().setPostProcessingScript;
  const getPromptEngineeringScript =
    useStore.getState().promptEngineeringScript;
  const getPostProcessingScript =
    useStore.getState().postProcessingScript;

  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const applyImportData = (parsedData: any) => {
    // import folders
    const offset = Object.keys(parsedData.folders).length;
    const updatedFolders = useStore.getState().folders;
    Object.values(updatedFolders).forEach((f) => (f.order += offset));
    setFolders({ ...parsedData.folders, ...updatedFolders });

    // keep a record of the imported chat ids
    const ids: string[] = [];
    const prevChats = useStore.getState().chats;
    if (parsedData.chats) {
      parsedData.chats.forEach((chat: ChatInterface) => {
        let id = chat.id;
        if (ids.includes(id)) {
          id = uuidv4();
        }
        ids.push(id);
        chat.id = id;
      });
      if (prevChats) {
        const updatedChats: ChatInterface[] = JSON.parse(
          JSON.stringify(prevChats)
        );
        setChats(parsedData.chats.concat(updatedChats));
      } else {
        setChats(parsedData.chats);
      }
    }

    // restore optional settings only if current values are empty/falsy
    if (
      typeof parsedData.promptEngineeringScript === 'string' &&
      !getPromptEngineeringScript
    ) {
      setPromptEngineeringScript(parsedData.promptEngineeringScript);
    }
    if (
      typeof parsedData.postProcessingScript === 'string' &&
      !getPostProcessingScript
    ) {
      setPostProcessingScript(parsedData.postProcessingScript);
    }

    // restore API settings (always restore for encrypted/protected exports)
    if (typeof parsedData.apiEndpoint === 'string') {
      setApiEndpoint(parsedData.apiEndpoint);
    }
    if (typeof parsedData.apiKey === 'string') {
      setApiKey(parsedData.apiKey);
    }
    if (typeof parsedData.additionalBodyParameters === 'string') {
      setAdditionalBodyParameters(parsedData.additionalBodyParameters);
    }
  };

  const handleFileUpload = async () => {
    if (!inputRef || !inputRef.current) return;
    const file = inputRef.current.files?.[0];

    if (!file) {
      setAlert({ message: 'No file selected', success: false });
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = event.target?.result as string;

      try {
        let parsedData = JSON.parse(data);

        if (isLegacyImport(parsedData)) {
          setAlert({
            message: 'Invalid chats data format',
            success: false,
          });
          return;
        }

        // Handle encrypted exports
        if (parsedData.version === 'encrypted') {
          if (!password.trim()) {
            setAlert({
              message: 'Password required for encrypted file',
              success: false,
            });
            return;
          }
          try {
            const decrypted = await decryptWithPassword(
              parsedData.salt,
              parsedData.iv,
              parsedData.ciphertext,
              password.trim()
            );
            parsedData = JSON.parse(decrypted);
          } catch {
            setAlert({
              message: 'Incorrect password or corrupted encrypted file',
              success: false,
            });
            return;
          }
        }

        switch ((parsedData as ExportBase).version) {
          case 1:
            if (validateExportV1(parsedData)) {
              applyImportData(parsedData);
              setAlert({ message: 'Succesfully imported!', success: true });
            } else {
              setAlert({
                message: 'Invalid format',
                success: false,
              });
            }
            break;
          default:
            setAlert({
              message: 'Unsupported file version',
              success: false,
            });
        }
      } catch (error: unknown) {
        setAlert({ message: (error as Error).message, success: false });
      }
    };

    reader.readAsText(file);
  };

  return (
    <>
      <label className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
        {t('import')} (JSON)
      </label>
      <input
        className='w-full text-sm file:p-2 text-gray-800 file:text-gray-700 dark:text-gray-300 dark:file:text-gray-200 rounded-md cursor-pointer focus:outline-none bg-gray-50 file:bg-gray-100 dark:bg-gray-800 dark:file:bg-gray-700 file:border-0 border border-gray-300 dark:border-gray-600 placeholder-gray-900 dark:placeholder-gray-300 file:cursor-pointer'
        type='file'
        ref={inputRef}
      />
      <input
        type='password'
        className='w-full text-sm p-2 mt-2 text-gray-800 dark:text-gray-300 rounded-md focus:outline-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400'
        placeholder='Password (required for encrypted files)'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className='btn btn-small btn-primary mt-3'
        onClick={handleFileUpload}
        aria-label={t('import') as string}
      >
        {t('import')}
      </button>
      {alert && (
        <div
          className={`relative py-2 px-3 w-full mt-3 border rounded-md text-gray-600 dark:text-gray-100 text-sm whitespace-pre-wrap ${
            alert.success
              ? 'border-green-500 bg-green-500/10'
              : 'border-red-500 bg-red-500/10'
          }`}
        >
          {alert.message}
        </div>
      )}
    </>
  );
};

export default ImportChat;
