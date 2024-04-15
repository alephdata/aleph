import { useState } from 'react';
import { Classes, Card, Switch } from '@blueprintjs/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import { updateRole } from 'actions';
import { selectCurrentRole } from 'selectors';
import { showSuccessToast } from 'app/toast';

export default function NotificationSettings() {
  const dispatch = useDispatch();
  const currentRole = useSelector(selectCurrentRole);
  const [isLoading, setIsLoading] = useState(false);

  const intl = useIntl();
  const successMessage = intl.formatMessage({
    id: 'settings.notifications.success',
    defaultMessage: 'Your notification preferences have been updated.',
  });

  const updateNotifications = async (receiveNotifications) => {
    const role = {
      id: currentRole.id,
      is_muted: !receiveNotifications,
    };

    setIsLoading(true);
    await dispatch(updateRole(role));
    setIsLoading(false);
    showSuccessToast(successMessage);
  };

  return (
    <Card elevation={1}>
      <h4 className={Classes.HEADING}>
        <FormattedMessage
          id="settings.notifications.title"
          defaultMessage="Notifications"
        />
      </h4>

      <p>
        <FormattedMessage
          id="settings.notifications.text"
          defaultMessage="Aleph can send you email notification when something happens in an investigation or dataset you have access to, for example when someone else uploads a new file."
        />
      </p>

      <Switch
        defaultChecked={!currentRole.is_muted}
        label={
          <FormattedMessage
            id="settings.email.muted"
            defaultMessage="Receive daily notification emails"
          />
        }
        onChange={(event) => updateNotifications(event.target.checked)}
        disabled={isLoading}
      />
    </Card>
  );
}
