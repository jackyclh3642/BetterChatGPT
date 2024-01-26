import React from 'react';

import LeftChevronArrow from '@icon/LeftChevronArrow';

import BaseButton from './BaseButton';

const LeftButton = ({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <BaseButton
      icon={<LeftChevronArrow />}
      buttonProps={{ 'aria-label': 'go to previous message' }}
      onClick={onClick}
    />
  );
};

export default LeftButton;
