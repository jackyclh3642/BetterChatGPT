import React from 'react';
import useStore from '@store/store';
import { useState, useEffect } from 'react';

import Avatar from './Avatar';
import MessageContent from './MessageContent';

import { Role, ChatInterface } from '@type/chat';
import RoleSelector from './RoleSelector';
import LeftButton from './View/Button/LeftButton';
import RightButton from './View/Button/RightButton';
import useSubmit from '@hooks/useSubmit';
import { getMessages } from '@utils/chat';
import RefreshButton from './View/Button/RefreshButton';
import BookmarkButton from './View/Button/BookmarkButton';
import JumpIntoButton from './View/Button/JumpIntoButton';
import RightMostButton from './View/Button/RightMostButton';
import ShowAltButton from './View/Button/ShowAltButton';

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
    alt,
  }: {
    role: Role;
    content: string;
    messageIndex: number;
    sticky?: boolean;
    alt?: string;
  }) => {
    const hideSideMenu = useStore((state) => state.hideSideMenu);
    const advancedMode = useStore((state) => state.advancedMode);
    
    const generating = useStore((state) => state.generating);
    const setChats = useStore((state) => state.setChats);
    const currentChatIndex = useStore((state) => state.currentChatIndex);
    const { handleSubmit } = useSubmit();
    const [isShowAlt, setIsShowAlt] = useState<boolean>(false);
    const messages = useStore(
      (state) =>
        // state.chats ? state.chats[state.currentChatIndex].messages : [],
        state.chats ? getMessages(state.chats[state.currentChatIndex]) : []
    );

    useEffect(() => {
      setIsShowAlt(messageIndex === messages.length - 1);
    }, [generating]);
    // run a breath first search and remember the childID queue of the next favorite message chain
    // the initial search queue is the child of the current message, and the id array

    const getNextFavoriteMessageChain = () => {
      let favoriteMessageChain: number[] = [];
      const searchQueue = [...Array(messages[messageIndex].children.length).keys()].map(i=>[i])
      // console.log(`running getNextFavoriteMessageChain on messageIndex: ${messageIndex}`)
      // console.log(searchQueue)
      let returnNext = false;
      while (searchQueue.length > 0) {
        const ids = searchQueue.shift()!;
        let currentMessage = messages[messageIndex]

        // // Skip this chain if we are already looking at it
        let allSame = true;
        for (const id of ids) {
          if (id !== currentMessage.childId) {
            allSame = false;
          }
          currentMessage = currentMessage.children[id];
        }
        // console.log(currentMessage)

        if (currentMessage.favorite) {
          if (allSame) {
            returnNext = true;
            continue;
          }
          if (returnNext) {
            return ids;
          }
          if (favoriteMessageChain.length === 0) {
            favoriteMessageChain = ids;
          }
          continue;
        }
        searchQueue.push(...[...Array(currentMessage.children.length).keys()].map(i=>[...ids, i]))
      }
      return favoriteMessageChain;
      // return [];
    }

    const handleJumpInto = () => {
      if (generating) return;
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const nextFavoriteMessageChain = getNextFavoriteMessageChain();
      let currentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex];
      for (const id of nextFavoriteMessageChain) {
        currentMessage.childId = id;
        currentMessage = currentMessage.children[id];
      }
      setChats(updatedChats);
    }

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

    const handleMoveRightMost = () => {
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
      parentMessage.childId = parentMessage.children.length - 1;
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
        role, content: '', childId: -1, children: [], favorite: false})
      parentMessage.childId = parentMessage.children.length - 1;
      setChats(updatedChats);
      handleSubmit();
    }

    const handleBookmark = () => {
      if (generating) return;
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const currentMessage = getMessages(updatedChats[currentChatIndex])[messageIndex];
      currentMessage.favorite = !currentMessage.favorite;
      setChats(updatedChats);
    }

    const handleShowAlt = () => {
      if (generating) return;
      setIsShowAlt(!isShowAlt);
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
              {!sticky && <>
                <div className='self-center'><JumpIntoButton onClick={handleJumpInto} canJumpInto={getNextFavoriteMessageChain().length > 0}/></div>
              </>}

              {/* Todo: to refactor this into its own component */}
              {messageIndex !== 0 && !sticky && <>
                {alt && (<div className='self-center'><ShowAltButton onClick={handleShowAlt} isShowAlt={isShowAlt}/></div>)}
                <div className='self-center'><BookmarkButton onClick={handleBookmark} isBookmark={messages[messageIndex].favorite}/></div>
                <div className='self-center'><LeftButton onClick={handleMoveLeft}/></div>
                <div className = 'text-center dark:text-gray-400 md:invisible md:group-hover:visible visible'>
                  {messages[messageIndex-1].childId + 1} / {messages[messageIndex-1].children.length}
                </div>
                <div className='self-center'><RightButton onClick={handleMoveRight}/></div>
                <div className='self-center'><RightMostButton onClick={handleMoveRightMost}/></div>
                { role === 'assistant' && <div className='self-center'><RefreshButton onClick={handleRefresh}/></div>}
              </>}
            </div>  
            }
            <MessageContent
              role={role}
              content={content}
              messageIndex={messageIndex}
              sticky={sticky}
              alt={alt}
              isShowAlt={isShowAlt}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default Message;
