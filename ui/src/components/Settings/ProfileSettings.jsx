import { useState } from 'react';
import {
  Button,
  Classes,
  Card,
  FormGroup,
  InputGroup,
} from '@blueprintjs/core';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import { updateRole } from 'actions';
import { selectCurrentRole } from 'selectors';
import { showSuccessToast } from 'app/toast';

export default function ProfileSettings() {
  const dispatch = useDispatch();
  const currentRole = useSelector(selectCurrentRole);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(currentRole.name);

  const intl = useIntl();
  const successMessage = intl.formatMessage({
    id: 'settings.saved',
    defaultMessage: 'It’s official, your profile is updated.',
  });

  const onUpdate = async (event) => {
    event.preventDefault();

    const role = {
      id: currentRole.id,
      name,
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
          id="settings.profile.title"
          defaultMessage="Profile"
        />
      </h4>

      <form onSubmit={onUpdate}>
        <FormGroup
          label={<FormattedMessage id="settings.name" defaultMessage="Name" />}
          labelFor="name"
        >
          <InputGroup
            id="name"
            defaultValue={currentRole.name}
            onInput={(event) => setName(event.target.value)}
          />
        </FormGroup>

        <FormGroup
          label={
            <FormattedMessage
              id="settings.email"
              defaultMessage="Email address"
            />
          }
          labelFor="email"
          helperText={
            <FormattedMessage
              id="settings.email_no_change"
              defaultMessage="Your email address cannot be changed"
            />
          }
        >
          <InputGroup id="email" defaultValue={currentRole.email} readOnly />
        </FormGroup>

        <Button type="submit" loading={isLoading}>
          <FormattedMessage id="settings.save" defaultMessage="Save" />
        </Button>
      </form>
    </Card>
  );
}
