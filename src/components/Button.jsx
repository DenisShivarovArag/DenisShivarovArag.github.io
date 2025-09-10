import React from "react";
import "./Button.css";

const Button = ({ onClick, disabled, className, icon: Icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`button ${className}`}
  >
    {Icon && <Icon className="button-icon" />}
    {children}
  </button>
);

export default Button;
