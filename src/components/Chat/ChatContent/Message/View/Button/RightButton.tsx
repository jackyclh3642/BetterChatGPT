import React from 'react';

import RightChevronArrow from '@icon/RightChevronArrow';

import BaseButton from './BaseButton';

const RightButton = ({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <BaseButton
      icon={<RightChevronArrow />}
      buttonProps={{ 'aria-label': 'go to next message' }}
      onClick={onClick}
    />
  );
};

export default RightButton;
