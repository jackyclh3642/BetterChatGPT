import React from 'react';

import JumpInto from '@icon/JumpInto';

import BaseButton from './BaseButton';

const JumpIntoButton = ({
  onClick,
  canJumpInto,
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  canJumpInto: boolean;
}) => {
  return (
    <BaseButton
      icon={canJumpInto ? <JumpInto /> : <></>}
      buttonProps={{ 'aria-label': 'jump into favorite message' }}
      onClick={onClick}
    />
  );
};

export default JumpIntoButton;
