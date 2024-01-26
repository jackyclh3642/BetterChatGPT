import React, { memo } from 'react';

import EditIcon2 from '@icon/EditIcon2';

import BaseButton from './BaseButton';

const EditButton = memo(
  ({
    // setIsEdit,
    onClick,
  }: {
    // setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  }) => {
    return (
      <BaseButton
        icon={<EditIcon2 />}
        buttonProps={{ 'aria-label': 'edit message' }}
        onClick={onClick}
      />
    );
  }
);

export default EditButton;
