import React from 'react';
import './index.scss';
import './index.css';

export type ButtonProps = {
  label: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
const style = {
  backgroundColor: '#007bff',
  color: '#fff',
  border: '0',
  borderRadius: '.25rem',
  fontSize: '1rem',
};

const Button: React.FC<ButtonProps> = ({ label }) => (
  <button type="button" className="scsstst csstst">
    hage{label}
  </button>
);

export default Button;
