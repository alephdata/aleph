import { useState } from 'react';
import { Classes, Card, HTMLSelect } from '@blueprintjs/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import { updateRole } from 'actions';
import { selectMetadata, selectCurrentRole } from 'selectors';
import { showSuccessToast } from 'app/toast';

export default function LanguageSettings() {
  const dispatch = useDispatch();
  const metadata = useSelector(selectMetadata);
  const currentRole = useSelector(selectCurrentRole);
  const [isLoading, setIsLoading] = useState(false);

  const options = Object.entries(metadata.app.locales).map(([code, label]) => ({
    value: code,
    label,
  }));

  const intl = useIntl();
  const successMessage = intl.formatMessage({
    id: 'settings.locale.success',
    defaultMessage: 'Your language preference has been updated.',
  });

  const updateLocale = async (locale) => {
    const role = {
      id: currentRole.id,
      locale,
    };

    setIsLoading(true);
    await dispatch(updateRole(role));
    setIsLoading(false);
    showSuccessToast(successMessage);
  };

  const localeMessage = (
    <FormattedMessage id="settings.locale" defaultMessage="Language" />
  );

  return (
    <Card elevation={1}>
      <h4 className={Classes.HEADING}>{localeMessage}</h4>

      <p>
        <FormattedMessage
          id="ssettings.locale.text"
          defaultMessage="Change the language of the Aleph user interface."
        />
      </p>

      <label>
        <span className="visually-hidden">{localeMessage}</span>
        <HTMLSelect
          options={options}
          defaultValue={currentRole.locale || metadata.app.locale}
          onChange={(event) => updateLocale(event.target.value)}
          disabled={isLoading}
        />
      </label>
    </Card>
  );
}
