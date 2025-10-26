import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrustShieldLogo } from '@/ui/components/TrustWallet';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';
import { useWallet } from 'ui/utils';
import { useRabbyDispatch } from 'ui/store';
import { copyAddress } from '@/ui/utils/clipboard';
import './TrustDashboardHeader.less';

export const TrustDashboardHeader = () => {
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const currentAccount = useCurrentAccount();
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState<string>('Main wallet');
  const [accountLabel, setAccountLabel] = useState<string>('Account 1');

  useEffect(() => {
    if (currentAccount) {
      wallet
        .getAlianName(currentAccount?.address.toLowerCase())
        .then((name) => {
          if (name) {
            setDisplayName(name);
          }
        });
    }
  }, [currentAccount]);

  const handleCopyAddress = () => {
    if (currentAccount?.address) {
      copyAddress(currentAccount.address);
    }
  };

  return (
    <div className="trust-dashboard-header">
      <div className="trust-header-top">
        <div className="trust-header-brand">
          <TrustShieldLogo size={24} />
          <span className="trust-header-title">Trust Wallet</span>
        </div>
        <div className="trust-header-actions">
          <button className="trust-header-icon-btn" title="Pin">
            📌
          </button>
          <button className="trust-header-icon-btn" title="Close">
            ✕
          </button>
        </div>
      </div>

      <div className="trust-wallet-selector">
        <div className="trust-wallet-info">
          <div className="trust-wallet-name">{displayName}</div>
          <div className="trust-wallet-account">{accountLabel}</div>
        </div>
        <button className="trust-wallet-dropdown">▼</button>
      </div>

      <div className="trust-header-toolbar">
        <button
          className="trust-toolbar-btn"
          title="Wallet"
          onClick={() => history.push('/manage-address')}
        >
          👛
        </button>
        <button
          className="trust-toolbar-btn"
          title="Network"
          onClick={() => history.push('/chain-list')}
        >
          🌐
        </button>
        <button
          className="trust-toolbar-btn"
          title="Copy Address"
          onClick={handleCopyAddress}
        >
          📋
        </button>
        <button
          className="trust-toolbar-btn"
          title="Search"
          onClick={() => history.push('/dapp-search')}
        >
          🔍
        </button>
        <button
          className="trust-toolbar-btn"
          title="Settings"
          onClick={() => history.push('/settings')}
        >
          ⚙️
        </button>
      </div>

      <div className="trust-balance-section">
        <div className="trust-balance-amount">$0.00</div>
        <div className="trust-balance-actions">
          <button className="trust-balance-action-btn" title="Refresh">
            🔄
          </button>
          <button className="trust-balance-action-btn" title="History">
            📊
          </button>
        </div>
      </div>
    </div>
  );
};
