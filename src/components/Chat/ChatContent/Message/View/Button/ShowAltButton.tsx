import React from 'react';

import ChatBubble from '@icon/ChatBubble';
import ChatBubbleFilled from '@icon/ChatBubbleFilled';

import BaseButton from './BaseButton';

const BookmarkButton = ({
  onClick,
  isShowAlt,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isShowAlt: boolean;
}) => {
  return (
    <BaseButton
      icon={isShowAlt ? <ChatBubbleFilled /> : <ChatBubble />}
      buttonProps={{ 'aria-label': 'toggle showing reasoning' }}
      onClick={onClick}
    />
  );
};

export default BookmarkButton;
