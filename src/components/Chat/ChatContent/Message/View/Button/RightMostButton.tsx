import React from 'react';

import DoubleRightChevronArrow from '@icon/DoubleRightChevronArrow';

import BaseButton from './BaseButton';

const RightMostButton = ({
  onClick,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  return (
    <BaseButton
      icon={<DoubleRightChevronArrow />}
      buttonProps={{ 'aria-label': 'go to last message' }}
      onClick={onClick}
    />
  );
};

export default RightMostButton;
