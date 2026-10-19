import React, { useState } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import PopupModal from '@components/PopupModal';
import CodeEditor from '@components/CodeEditor';
import CodeIcon from '@icon/FileTextIcon';
import PlayIcon from '@icon/PlayIcon';
import {
  previewPostProcessingScript,
  PostProcessingPreviewOutput,
} from '@utils/promptEngineering';

const PostProcessingMenu = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  return (
    <div className='mt-2'>
      <button
        className='btn btn-neutral w-full'
        onClick={() => setIsModalOpen(true)}
        aria-label={t('postProcessing') as string}
      >
        <CodeIcon className='w-4 h-4 mr-2' />
        {t('postProcessing')}
      </button>
      {isModalOpen && (
        <PostProcessingMenuPopUp setIsModalOpen={setIsModalOpen} />
      )}
    </div>
  );
};

const PostProcessingMenuPopUp = ({
  setIsModalOpen,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation();

  const postProcessingScript = useStore(
    (state) => state.postProcessingScript
  );
  const setPostProcessingScript = useStore(
    (state) => state.setPostProcessingScript
  );

  const [_script, _setScript] = useState<string>(postProcessingScript);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewOutput, setPreviewOutput] =
    useState<PostProcessingPreviewOutput | null>(null);

  const handleSave = () => {
    setPostProcessingScript(_script);
    setIsModalOpen(false);
  };

  const insertTemplate = (template: string) => {
    _setScript(template);
  };

  const handlePreview = () => {
    const dummyMessage = {
      role: 'assistant' as const,
      content: 'Hello, this is the current message content.',
      alt: '',
      childId: 0,
      favorite: false,
      children: [],
    };

    const dummyDelta = {
      content: ' Appended chunk content.',
      alt: '',
      toolCalls: [],
    };

    const output = previewPostProcessingScript(_script, {
      originalMessage: dummyMessage,
      delta: dummyDelta,
    });

    setPreviewOutput(output);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <PopupModal
        title={t('postProcessing') as string}
        setIsModalOpen={setIsModalOpen}
        handleConfirm={handleSave}
        cancelButton={true}
        fullWidth={true}
      >
        <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[95vw] md:w-[90vw] lg:w-[80vw] max-w-5xl text-sm text-gray-900 dark:text-gray-300'>
          <p className='mb-3 text-xs text-gray-500 dark:text-gray-400'>
            {t('postProcessingDescription') as string}
          </p>

          <div className='flex gap-2 mb-3 flex-wrap'>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Available:
//   originalMessage - The current last assistant message {role, content, alt, ...}
//   delta           - The incoming chunk {content: string, alt: string, toolCalls: array}
// Return: the updated message object.

return {
  ...originalMessage,
  content: originalMessage.content + delta.content,
  alt: (originalMessage.alt || '') + delta.alt,
};`)
              }
            >
              Pass-through
            </button>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Append content normally, but strip thinking tags
const thinkingRegex = /<thinking>[\\s\\S]*?<\\/thinking>/g;
return {
  ...originalMessage,
  content: (originalMessage.content + delta.content).replace(thinkingRegex, ''),
};`)
              }
            >
              Strip thinking
            </button>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Extract thinking into alt field
const contentMatch = (originalMessage.content + delta.content).match(/<thinking>([\\s\\S]*?)<\\/thinking>/);
const thinking = contentMatch ? contentMatch[1] : '';
return {
  ...originalMessage,
  content: (originalMessage.content + delta.content).replace(/<thinking>[\\s\\S]*?<\\/thinking>/g, ''),
  alt: (originalMessage.alt || '') + thinking,
};`)
              }
            >
              Extract thinking
            </button>
            <button
              className='px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              onClick={() =>
                insertTemplate(`// Prefix every chunk with a marker
return {
  ...originalMessage,
  content: originalMessage.content + '[CHUNK] ' + delta.content,
};`)
              }
            >
              Prefix chunks
            </button>
          </div>

          <div className='h-96 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden mb-3'>
            <CodeEditor
              value={_script}
              onChange={_setScript}
              language='javascript'
              className='h-full'
              placeholder='// Your post processing script...'
            />
          </div>

          <button
            className='flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
            onClick={handlePreview}
          >
            <PlayIcon className='w-3 h-3' />
            {t('preview') as string}
          </button>
        </div>
      </PopupModal>

      {isPreviewOpen && previewOutput && (
        <PreviewModal
          output={previewOutput}
          setIsPreviewOpen={setIsPreviewOpen}
        />
      )}
    </>
  );
};

const PreviewModal = ({
  output,
  setIsPreviewOpen,
}: {
  output: PostProcessingPreviewOutput;
  setIsPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation();

  const jsonString = JSON.stringify(output.message, null, 2);

  return (
    <PopupModal
      title={t('preview') as string}
      setIsModalOpen={setIsPreviewOpen}
      cancelButton={true}
      fullWidth={true}
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[95vw] md:w-[90vw] lg:w-[80vw] max-w-5xl text-sm text-gray-900 dark:text-gray-300'>
        {output.error && (
          <div className='mb-4 p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono text-xs whitespace-pre-wrap'>
            <strong>Error:</strong>
            {'\n'}
            {output.error}
          </div>
        )}

        <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center justify-between'>
          <span>Updated Message</span>
        </div>

        <div className='h-80 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden mb-4'>
          <CodeEditor
            value={jsonString}
            onChange={() => {}}
            language='json'
            className='h-full'
            readOnly
          />
        </div>

        {output.logs.length > 0 && (
          <>
            <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              Console Output
            </div>
            <div className='h-40 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden'>
              <CodeEditor
                value={output.logs.join('\n')}
                onChange={() => {}}
                language='json'
                className='h-full'
                readOnly
              />
            </div>
          </>
        )}
      </div>
    </PopupModal>
  );
};

export default PostProcessingMenu;
