import React, { useEffect, useMemo, useRef } from 'react';
import { Input, Form, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import {
  useWallet,
  useApproval,
  useWalletRequest,
  getUiType,
  openInternalPageInTab,
} from 'ui/utils';
import { TrustShieldLogo } from '@/ui/components/TrustWallet';
import clsx from 'clsx';
import styled from 'styled-components';
import { FullscreenContainer } from '@/ui/component/FullscreenContainer';
import qs from 'qs';
import { isString } from 'lodash';
import './TrustUnlock.less';

const InputFormStyled = styled(Form.Item)`
  .ant-form-item-explain {
    font-size: 13px;
    line-height: 16px;
    margin-top: 12px;
    margin-bottom: 0;
    min-height: 0px;
    color: #EF4444;
    font-weight: 500;
  }
`;

const TrustUnlock = () => {
  const wallet = useWallet();
  const [, resolveApproval] = useApproval();
  const [form] = Form.useForm();
  const inputEl = useRef<Input>(null);
  const UiType = getUiType();
  const { t } = useTranslation();
  const history = useHistory();
  const isUnlockingRef = useRef(false);
  const [hasForgotPassword, setHasForgotPassword] = React.useState(false);
  const location = useLocation();
  const [inputError, setInputError] = React.useState('');
  const query = useMemo(() => {
    return qs.parse(location.search, {
      ignoreQueryPrefix: true,
    });
  }, [location.search]);

  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const [run] = useWalletRequest(wallet.unlock, {
    onSuccess() {
      if (UiType.isNotification) {
        if (query.from === '/connect-approval') {
          history.replace('/approval?ignoreOtherWallet=1');
        } else {
          resolveApproval();
        }
      } else if (UiType.isTab) {
        history.replace(query.from && isString(query.from) ? query.from : '/');
      } else {
        history.replace('/');
      }
    },
    onError(err) {
      console.log('error', err);
      setInputError(err?.message || t('page.unlock.password.error'));
      form.validateFields(['password']);
    },
  });

  const handleSubmit = async ({ password }: { password: string }) => {
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    await run(password);
    isUnlockingRef.current = false;
  };

  useEffect(() => {
    wallet.savedUnencryptedKeyringData().then(setHasForgotPassword);
  }, []);

  useEffect(() => {
    if (UiType.isTab) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <FullscreenContainer>
      <div className="trust-unlock-container">
        <div className="trust-unlock-content">
          <TrustShieldLogo size={100} />
          
          <h1 className="trust-unlock-title">
            Secure and trusted multi-chain crypto wallet
          </h1>

          <Form 
            autoComplete="off" 
            form={form} 
            onFinish={handleSubmit}
            className="trust-unlock-form"
          >
            <InputFormStyled
              name="password"
              label={<span className="trust-input-label">Password</span>}
              rules={[
                {
                  required: true,
                  message: t('page.unlock.password.required'),
                },
                {
                  validator: (_, value) => {
                    if (inputError) {
                      return Promise.reject(inputError);
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.Password
                placeholder="Enter password"
                className="trust-input"
                size="large"
                ref={inputEl}
                spellCheck={false}
                onChange={() => {
                  setInputError('');
                }}
              />
            </InputFormStyled>

            <Form.Item className="trust-unlock-button-wrapper">
              <Button
                block
                className="trust-unlock-button"
                htmlType="submit"
                type="primary"
                size="large"
              >
                Unlock
              </Button>
            </Form.Item>
          </Form>

          <div className="trust-unlock-footer">
            <p className="trust-unlock-footer-text">
              Can't login? You can erase your current wallet and set up a new one
            </p>
            {hasForgotPassword && (
              <button
                className="trust-unlock-reset-link"
                onClick={() => openInternalPageInTab('forgot-password')}
              >
                Reset wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </FullscreenContainer>
  );
};

export default TrustUnlock;

