import React from 'react';
import './ActionButtons.less';

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  primary,
}) => {
  return (
    <button
      className={`trust-action-button ${primary ? 'primary' : ''}`}
      onClick={onClick}
    >
      <span className="trust-action-icon">{icon}</span>
      <span className="trust-action-label">{label}</span>
    </button>
  );
};

interface ActionButtonsProps {
  onSend?: () => void;
  onSwap?: () => void;
  onFund?: () => void;
  onSell?: () => void;
  onEarn?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSend = () => {},
  onSwap = () => {},
  onFund = () => {},
  onSell = () => {},
  onEarn = () => {},
}) => {
  return (
    <div className="trust-action-buttons">
      <ActionButton icon="↑" label="Send" onClick={onSend} />
      <ActionButton icon="⟲" label="Swap" onClick={onSwap} />
      <ActionButton icon="+" label="Fund" onClick={onFund} primary />
      <ActionButton icon="🏛" label="Sell" onClick={onSell} />
      <ActionButton icon="🌱" label="Earn" onClick={onEarn} />
    </div>
  );
};
