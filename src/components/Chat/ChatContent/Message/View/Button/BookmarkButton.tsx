import React from 'react';

import Bookmark from '@icon/Bookmark';
import BookmarkFilled from '@icon/BookmarkFilled';

import BaseButton from './BaseButton';

const BookmarkButton = ({
  onClick,
  isBookmark,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isBookmark: boolean;
}) => {
  return (
    <BaseButton
      icon={isBookmark ? <BookmarkFilled /> : <Bookmark />}
      buttonProps={{ 'aria-label': 'bookmark current message' }}
      onClick={onClick}
    />
  );
};

export default BookmarkButton;
