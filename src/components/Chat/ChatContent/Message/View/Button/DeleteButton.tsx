import React, { memo } from 'react';

import DeleteIcon from '@icon/DeleteIcon';

import BaseButton from './BaseButton';

const DeleteButton = memo(
  ({
    onClick,
  }: {
    // setIsDelete: React.Dispatch<React.SetStateAction<boolean>>;
    onClick: React.MouseEventHandler<HTMLButtonElement>
  }) => {
    return (
      <BaseButton
        icon={<DeleteIcon />}
        buttonProps={{ 'aria-label': 'delete message' }}
        // onClick={() => setIsDelete(true)}
        onClick={onClick}
      />
    );
  }
);

export default DeleteButton;
