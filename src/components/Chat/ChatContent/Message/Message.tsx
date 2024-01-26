import React from 'react';
import useStore from '@store/store';

import Avatar from './Avatar';
import MessageContent from './MessageContent';

import { Role, ChatInterface } from '@type/chat';
import RoleSelector from './RoleSelector';
import LeftButton from './View/Button/LeftButton';
import RightButton from './View/Button/RightButton';
import useSubmit from '@hooks/useSubmit';
import { getMessages } from '@utils/chat';
import RefreshButton from './View/Button/RefreshButton';

// const backgroundStyle: { [role in Role]: string } = {
//   user: 'dark:bg-gray-800',
//   assistant: 'bg-gray-50 dark:bg-gray-650',
//   system: 'bg-gray-50 dark:bg-gray-650',
// };
const backgroundStyle = ['dark:bg-gray-800', 'bg-gray-50 dark:bg-gray-650'];

const Message = React.memo(
  ({
    role,
    content,
    messageIndex,
    sticky = false,
  }: {
    role: Role;
    content: string;
    messageIndex: number;
    sticky?: boolean;
  }) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    const advancedMode = useStore((state) => state.advancedMode);
    
    const generating = useStore((state) => state.generating);
    const setChats = useStore((state) => state.setChats);
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const { handleSubmit } = useSubmit();
    const messages = useStore(
      (state) =>
        // state.chats ? state.chats[state.currentChatIndex].messages : [],
        state.chats ? getMessages(state.chats[state.currentChatIndex]) : []
    );

    const handleMoveLeft = () => {
      if (generating) return;
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const parentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex-1];
      parentMessage.childId = Math.max(0, parentMessage.childId - 1);
      // const 
      // handleMove('up');
      setChats(updatedChats);
    };

    const handleMoveRight = () => {
      if (generating) return;
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const parentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex-1];
      // if (parentMessage.childId === parentMessage.children.length - 1 && role === 'assistant') {
      //   parentMessage.childId++;
      //   parentMessage.children.push({
      //     role, content: '', childId: -1, children: []})
      //   setChats(updatedChats);
      //   handleSubmit();
      //   // handleRefresh();
      //   // parentMessage.children.push({ role: parentMessage.role, content: '', childId: -1, children: []});
      //   // setChats(updatedChats);
      // } else {
      parentMessage.childId = Math.min(parentMessage.children.length - 1, parentMessage.childId + 1);
      setChats(updatedChats);
      // }
      // parentMessage.childId = Math.min(parentMessage.children.length - 1, parentMessage.childId + 1);
      // const 
      // handleMove('up');
    };

    const handleRefresh = () => {
      if (generating) return;
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const parentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex-1];
      parentMessage.children.push({
        role, content: '', childId: -1, children: []})
      parentMessage.childId = parentMessage.children.length - 1;
      setChats(updatedChats);
      handleSubmit();
    }

    return (
      <div
        className={`w-full border-b border-black/10 dark:border-gray-900/50 text-gray-800 dark:text-gray-100 group ${
          backgroundStyle[messageIndex % 2]
        }`}
      >
        <div
          className={`text-base gap-4 md:gap-6 m-auto p-4 md:py-6 flex transition-all ease-in-out ${
            hideSideMenu
              ? 'md:max-w-5xl lg:max-w-5xl xl:max-w-6xl'
              : 'md:max-w-3xl lg:max-w-3xl xl:max-w-4xl'
          }`}
        >
          <Avatar role={role} />
          <div className='w-[calc(100%-50px)] '>
            {advancedMode &&
            <div className='flex lg:w-[calc(100%-115px)] items-center'>
              <RoleSelector
                role={role}
                messageIndex={messageIndex}
                sticky={sticky}
              />
              <div className='grow'></div>
              {/* Todo: to refactor this into its own component */}
              {messageIndex !== 0 && !sticky && <>
                <div className='self-center'><LeftButton onClick={handleMoveLeft}/></div>
                <div className = 'text-center dark:text-gray-400 md:invisible md:group-hover:visible visible'>
                  {messages[messageIndex-1].childId + 1} / {messages[messageIndex-1].children.length}
                </div>
                <div className='self-center'><RightButton onClick={handleMoveRight}/></div>
                { role === 'assistant' && <div className='self-center'><RefreshButton onClick={handleRefresh}/></div>}
              </>}
            </div>  
            }
            <MessageContent
              role={role}
              content={content}
              messageIndex={messageIndex}
              sticky={sticky}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default Message;
