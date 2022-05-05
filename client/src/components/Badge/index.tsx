import React from 'react';

export type BadgeProps = {
  label: string;
};

const style = {
  backgroundColor: '#6c757d',
  color: '#fff',
  borderRadius: '.25rem',
  display: 'inline-block',
  padding: '.25rem .4rem',
  fontSize: '1rem',
};

const Badge: React.FC<BadgeProps> = ({ label }) => (
  <span style={style}>fuga{label}</span>
);

export default Badge;
