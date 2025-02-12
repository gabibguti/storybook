import type { ComponentProps, FC } from 'react';
import React, { Fragment, useEffect, useState } from 'react';
import { styled, useTheme } from '@storybook/theming';
import { Button, IconButton, Loader, Icons } from '@storybook/components';
import { Icon } from '@storybook/components/experimental';
import { useStorybookApi, useStorybookState } from '@storybook/manager-api';
import { global } from '@storybook/global';

const Centered = styled.div({
  top: '50%',
  position: 'absolute',
  transform: 'translateY(-50%)',
  width: '100%',
  textAlign: 'center',
});

const LoaderWrapper = styled.div({
  position: 'relative',
  height: '32px',
});

const Message = styled.div(({ theme }) => ({
  paddingTop: '12px',
  color: theme.textMutedColor,
  maxWidth: '295px',
  margin: '0 auto',
  fontSize: `${theme.typography.size.s1}px`,
  lineHeight: `16px`,
}));

const Container = styled.div(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  bottom: '40px',
  background: theme.background.bar,
  fontSize: `13px`,
  borderTop: '1px solid',
  borderColor: theme.appBorderColor,
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ToggleNotificationButton = styled(IconButton)(({ theme }) => ({
  fontWeight: theme.typography.weight.regular,
  color: theme.color.mediumdark,
  margin: 0,
}));

const CopyButton = styled(Button)(({ theme }) => ({
  '&&': {
    fontSize: `13px`,
    color: theme.color.defaultText,
    margin: 0,
    padding: 0,
    borderRadius: 0,
  },
}));

export const WhatsNewFooter = ({
  isNotificationsEnabled,
  onToggleNotifications,
  onCopyLink,
}: {
  isNotificationsEnabled: boolean;
  onToggleNotifications?: () => void;
  onCopyLink?: () => void;
}) => {
  const theme = useTheme();
  const [copyText, setCopyText] = useState('Copy Link');
  const copyLink = () => {
    onCopyLink();
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy Link'), 4000);
  };

  return (
    <Container>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon.Heart color={theme.color.mediumdark} />
        <div>Share this with your team.</div>
        <CopyButton onClick={copyLink} small>
          {copyText}
        </CopyButton>
      </div>
      <ToggleNotificationButton onClick={onToggleNotifications}>
        {isNotificationsEnabled ? (
          <>
            <Icon.EyeClose />
            &nbsp;Hide notifications
          </>
        ) : (
          <>
            <Icon.Eye />
            &nbsp;Show notifications
          </>
        )}
      </ToggleNotificationButton>
    </Container>
  );
};

const Iframe = styled.iframe<{ isLoaded: boolean }>(
  {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: 0,
    margin: 0,
    padding: 0,
    width: '100%',
    height: 'calc(100% - 80px)',
    background: 'white',
  },
  ({ isLoaded }) => ({ visibility: isLoaded ? 'visible' : 'hidden' })
);

const AlertIcon = styled(((props) => <Icons icon="alert" {...props} />) as FC<
  Omit<ComponentProps<typeof Icons>, 'icon'>
>)(({ theme }) => ({
  color: theme.textMutedColor,
  width: 32,
  height: 32,
  margin: '0 auto',
}));

const WhatsNewLoader: FC = () => (
  <Centered>
    <LoaderWrapper>
      <Loader />
    </LoaderWrapper>
    <Message>Loading...</Message>
  </Centered>
);

const MaxWaitTimeMessaging: FC = () => (
  <Centered>
    <AlertIcon />
    <Message>The page couldn't be loaded. Check your internet connection and try again.</Message>
  </Centered>
);

export interface WhatsNewProps {
  didHitMaxWaitTime: boolean;
  isLoaded: boolean;
  onLoad: () => void;
  url?: string;
  isNotificationsEnabled: boolean;
  onCopyLink?: () => void;
  onToggleNotifications?: () => void;
}

const PureWhatsNewScreen: FC<WhatsNewProps> = ({
  didHitMaxWaitTime,
  isLoaded,
  onLoad,
  url,
  onCopyLink,
  onToggleNotifications,
  isNotificationsEnabled,
}) => (
  <Fragment>
    {!isLoaded && !didHitMaxWaitTime && <WhatsNewLoader />}
    {didHitMaxWaitTime ? (
      <MaxWaitTimeMessaging />
    ) : (
      <>
        <Iframe isLoaded={isLoaded} onLoad={onLoad} src={url} title={`What's new?`} />
        <WhatsNewFooter
          isNotificationsEnabled={isNotificationsEnabled}
          onToggleNotifications={onToggleNotifications}
          onCopyLink={onCopyLink}
        />
      </>
    )}
  </Fragment>
);

const MAX_WAIT_TIME = 10000; // 10 seconds

const WhatsNewScreen: FC = () => {
  const api = useStorybookApi();
  const state = useStorybookState();
  const { whatsNewData } = state;
  const [isLoaded, setLoaded] = useState(false);
  const [didHitMaxWaitTime, setDidHitMaxWaitTime] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => !isLoaded && setDidHitMaxWaitTime(true), MAX_WAIT_TIME);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (whatsNewData?.status !== 'SUCCESS') return null;

  const isNotificationsEnabled = !whatsNewData.disableWhatsNewNotifications;

  return (
    <PureWhatsNewScreen
      didHitMaxWaitTime={didHitMaxWaitTime}
      isLoaded={isLoaded}
      onLoad={() => {
        api.whatsNewHasBeenRead();
        setLoaded(true);
      }}
      url={whatsNewData.url}
      isNotificationsEnabled={isNotificationsEnabled}
      onCopyLink={() => {
        navigator.clipboard?.writeText(whatsNewData.blogUrl ?? whatsNewData.url);
      }}
      onToggleNotifications={() => {
        if (isNotificationsEnabled) {
          if (global.confirm('All update notifications will no longer be shown. Are you sure?')) {
            api.toggleWhatsNewNotifications();
          }
        } else {
          api.toggleWhatsNewNotifications();
        }
      }}
    />
  );
};

export { WhatsNewScreen, PureWhatsNewScreen };
