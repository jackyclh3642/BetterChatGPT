import React from 'react';

const DoubleRightChevronArrow = ({ className }: { className?: string }) => {
  return (

    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className={'w-4 h-4' + ' ' + className}
    >
        <path
            strokeLinecap="round"
            strokeWidth='2'
            strokeLinejoin="round"
            d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
        />
    </svg>
  );
};

export default DoubleRightChevronArrow;
