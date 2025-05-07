import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { selectCurrentRole, selectMetadata } from '/src/selectors.js';
import Screen from '/src/components/Screen/Screen';
import Dashboard from '/src/components/Dashboard/Dashboard';
import ProfileSettings from '/src/components/Settings/ProfileSettings';
import NotificationSettings from '/src/components/Settings/NotificationSettings';
import LanguageSettings from '/src/components/Settings/LanguageSettings';
import PasswordSettings from '/src/components/Settings/PasswordSettings';
import ApiKeySettings from '/src/components/Settings/ApiKeySettings';

import './SettingsScreen.scss';

export default function SettingsScreen() {
  const currentRole = useSelector(selectCurrentRole);
  const metadata = useSelector(selectMetadata);

  const intl = useIntl();
  const title = intl.formatMessage({
    id: 'settings.title',
    defaultMessage: 'Settings',
  });

  return (
    <Screen title={title} className="SettingsScreen" requireSession>
      <Dashboard>
        <div className="Dashboard__title-container">
          <h5 className="Dashboard__title">{title}</h5>
        </div>

        <div className="SettingsScreen__cards">
          {(!currentRole.isPending || currentRole.id) && (
            <>
              <ProfileSettings />
              <NotificationSettings />
              <LanguageSettings />
              {metadata.auth.password_login_uri && <PasswordSettings />}
              <ApiKeySettings />
            </>
          )}
        </div>
      </Dashboard>
    </Screen>
  );
}
