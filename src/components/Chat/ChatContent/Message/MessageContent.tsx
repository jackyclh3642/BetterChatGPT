import React, { useState } from 'react';
import useStore from '@store/store';

import ContentView from './View/ContentView';
import EditView from './View/EditView';
import { Role } from '@type/chat';
import ReasoningView from './View/ReasoningView';

const MessageContent = ({
  role,
  content,
  alt, // This is the thinking tokens, if present, it will be shown in the edit view
  messageIndex,
  sticky = false,
  isLast = false,
}: {
  role: Role;
  content: string;
  alt?: string;
  messageIndex: number;
  sticky?: boolean;
  isLast: boolean;
}) => {
  const [isEdit, setIsEdit] = useState<boolean>(sticky);
  const advancedMode = useStore((state) => state.advancedMode);
  const generating = useStore((state) => state.generating);

  return (
    <div className='relative flex flex-col gap-2 md:gap-3 lg:w-[calc(100%-115px)]'>
      {advancedMode && <div className='flex flex-grow flex-col gap-3'></div>}
      { /* This is the alt which will be normally collpasble accordin */ }
      { alt && (
        <details className = "group border" style={{ borderRadius: '0.25rem', borderColor: '#565869'}} open={generating && isLast  && false}>
          <summary className="flex items-center justify-between btn btn-neutral cursor-pointer list-none" style={{marginTop: '-1px', marginRight: '-1px', marginLeft: '-1px'}}>
            <span className="prose dark:prose-invert">Reasoning{generating&&content.length===0?"...":""}</span>
            <svg
              className="w-5 h-5 prose dark:prose-invert transition-transform duration-300 group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="p-7 py-4 text-gray-600">
            <ReasoningView
              alt={alt}
              setIsEdit={setIsEdit}
              messageIndex={messageIndex}
            />
          </div>
        </details>
      )}
      {isEdit ? (
        <EditView
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
          sticky={sticky}
        />
      ) : (
        <ContentView
          role={role}
          content={content}
          setIsEdit={setIsEdit}
          messageIndex={messageIndex}
        />
      )}
    </div>
  );
};

export default MessageContent;
