import React from 'react';

const JumpInto = ({ className }: { className?: string }) => {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={'w-4 h-4' + ' ' + className}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth='2'
            d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
        />
    </svg>
  );
};

export default JumpInto;
