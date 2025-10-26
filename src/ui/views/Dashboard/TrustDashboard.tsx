import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useHistory } from 'react-router-dom';
import remarkGfm from 'remark-gfm';

import { Modal } from 'ui/component';
import { connectStore, useRabbyDispatch, useRabbySelector } from 'ui/store';
import { useWallet } from 'ui/utils';
import './style.less';
import './TrustDashboard.less';

import PendingApproval from './components/PendingApproval';

import { CurrentConnection } from './components/CurrentConnection';
import { TrustDashboardHeader } from './components/DashboardHeader/TrustDashboardHeader';
import { DashboardPanel } from './components/DashboardPanel';
import { ActionButtons } from '@/ui/components/TrustWallet';
import { useCurrentAccount } from '@/ui/hooks/backgroundState/useAccount';

const TrustDashboard = () => {
  const history = useHistory();
  const wallet = useWallet();
  const dispatch = useRabbyDispatch();
  const currentAccount = useCurrentAccount();

  const { firstNotice, updateContent, version } = useRabbySelector((s) => ({
    ...s.appVersion,
  }));

  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  const getCurrentAccount = async () => {
    const account = await dispatch.account.getCurrentAccountAsync();
    if (!account) {
      history.replace('/no-address');
      return;
    }
  };

  useEffect(() => {
    getCurrentAccount();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      dispatch.gift.checkGiftEligibilityAsync({
        address: currentAccount.address,
        currentAccount,
      });
    }
  }, [currentAccount]);

  useEffect(() => {
    (async () => {
      await dispatch.addressManagement.getHilightedAddressesAsync();
      dispatch.accountToDisplay.getAllAccountsToDisplay();
      const pendingCount = await wallet.getPendingApprovalCount();
      setPendingApprovalCount(pendingCount);
      const hasAnyAccountClaimedGift = await wallet.getHasAnyAccountClaimedGift();
      dispatch.gift.setField({ hasClaimedGift: hasAnyAccountClaimedGift });
    })();
  }, []);

  useEffect(() => {
    dispatch.appVersion.checkIfFirstLoginAsync();
  }, [dispatch]);

  const { t } = useTranslation();

  const handleSend = () => {
    history.push('/send-token');
  };

  const handleSwap = () => {
    history.push('/swap');
  };

  const handleFund = () => {
    history.push('/receive');
  };

  const handleSell = () => {
    // TODO: Implement sell functionality
    console.log('Sell clicked');
  };

  const handleEarn = () => {
    // TODO: Implement earn functionality
    console.log('Earn clicked');
  };

  return (
    <>
      <div className={clsx('dashboard', 'trust-dashboard')}>
        <TrustDashboardHeader />

        <ActionButtons
          onSend={handleSend}
          onSwap={handleSwap}
          onFund={handleFund}
          onSell={handleSell}
          onEarn={handleEarn}
        />

        <div className="trust-dashboard-content">
          <DashboardPanel />
          <CurrentConnection />
        </div>

        <div className="trust-bottom-nav">
          <button className="trust-nav-item active">
            <span className="trust-nav-icon">🏠</span>
            <span className="trust-nav-label">Home</span>
          </button>
          <button
            className="trust-nav-item"
            onClick={() => history.push('/activities')}
          >
            <span className="trust-nav-icon">📈</span>
            <span className="trust-nav-label">Trending</span>
          </button>
          <button
            className="trust-nav-item"
            onClick={() => history.push('/swap')}
          >
            <span className="trust-nav-icon">🔄</span>
            <span className="trust-nav-label">Swap</span>
          </button>
          <button className="trust-nav-item" onClick={handleEarn}>
            <span className="trust-nav-icon">🌱</span>
            <span className="trust-nav-label">Earn</span>
          </button>
        </div>
      </div>

      <Modal
        visible={firstNotice && updateContent}
        title={t('page.dashboard.home.whatsNew')}
        className="first-notice"
        onCancel={() => {
          dispatch.appVersion.afterFirstLogin();
        }}
        maxHeight="420px"
      >
        <div>
          <p className="mb-12">{version}</p>
          <ReactMarkdown children={updateContent} remarkPlugins={[remarkGfm]} />
        </div>
      </Modal>

      {pendingApprovalCount > 0 && (
        <PendingApproval
          onRejectAll={() => {
            setPendingApprovalCount(0);
          }}
          count={pendingApprovalCount}
        />
      )}
    </>
  );
};

export default connectStore()(TrustDashboard);
