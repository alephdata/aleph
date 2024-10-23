import { useState } from 'react';
import {
  Button,
  Card,
  DialogBody,
  FormGroup,
  InputGroup,
  Intent,
} from '@blueprintjs/core';
import { Dialog } from 'react-ftm';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentRole } from 'selectors';
import { updateRole } from 'actions';
import { showSuccessToast, showWarningToast } from 'react-ftm/utils';

export default function PasswordSettings() {
  const dispatch = useDispatch();
  const currentRole = useSelector(selectCurrentRole);

  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const changeMessage = (
    <FormattedMessage
      id="settings.password.change"
      defaultMessage="Change password"
    />
  );

  const intl = useIntl();
  const successMessage = intl.formatMessage({
    id: 'settings.password.success',
    defaultMessage: 'Your password has been updated.',
  });

  const isValidCurrentPassword = currentPassword !== '';
  const isValidNewPassword = newPassword && newPassword.length >= 6;
  const isValidPasswordConfirmation = newPassword === passwordConfirmation;

  const newPasswordIntent =
    newPassword && !isValidNewPassword ? Intent.DANGER : null;
  const passwordConfirmationIntent =
    passwordConfirmation && !isValidPasswordConfirmation ? Intent.DANGER : null;

  const onUpdate = async (event) => {
    event.preventDefault();

    const role = {
      id: currentRole.id,
      current_password: currentPassword,
      password: newPassword,
    };

    setIsLoading(true);

    try {
      await dispatch(updateRole(role));
      setShowDialog(false);
      showSuccessToast(successMessage);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
    } catch (error) {
      showWarningToast(error.message);
    }

    setIsLoading(false);
  };

  return (
    <>
      <Card elevation={1}>
        <h4 className="bp4-heading">
          <FormattedMessage
            id="settings.password.title"
            defaultMessage="Change your password"
          />
        </h4>

        <Button onClick={() => setShowDialog(true)}>{changeMessage}</Button>
      </Card>

      <Dialog
        isOpen={showDialog}
        title={changeMessage}
        onClose={() => setShowDialog(false)}
      >
        <DialogBody>
          <form onSubmit={onUpdate}>
            <FormGroup
              label={
                <FormattedMessage
                  id="settings.current_password"
                  defaultMessage="Current password"
                />
              }
              labelFor="current_password"
              helperText={
                <FormattedMessage
                  id="settings.current_explain"
                  defaultMessage="Enter your current password to set a new one"
                />
              }
            >
              <InputGroup
                id="current_password"
                type="password"
                value={currentPassword}
                onInput={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </FormGroup>

            <FormGroup
              label={
                <FormattedMessage
                  id="settings.new_password"
                  defaultMessage="New password"
                />
              }
              labelFor="new_password"
              intent={newPasswordIntent}
              helperText={
                <FormattedMessage
                  id="settings.password_rules"
                  defaultMessage="Use at least six characters"
                />
              }
            >
              <InputGroup
                id="new_password"
                type="password"
                value={newPassword}
                onInput={(event) => setNewPassword(event.target.value)}
                intent={newPasswordIntent}
                required
                minLength={6}
              />
            </FormGroup>

            <FormGroup
              label={
                <FormattedMessage
                  id="settings.password_confirmation"
                  defaultMessage="Confirm new password"
                />
              }
              labelFor="password_confirmation"
              intent={passwordConfirmationIntent}
              helperText={
                passwordConfirmation &&
                !isValidPasswordConfirmation && (
                  <FormattedMessage
                    id="settings.passwords.missmatch"
                    defaultMessage="Passwords do not match"
                  />
                )
              }
            >
              <InputGroup
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onInput={(event) => setPasswordConfirmation(event.target.value)}
                intent={passwordConfirmationIntent}
                required
                minLength={6}
              />
            </FormGroup>

            <Button
              type="submit"
              fill
              intent={Intent.PRIMARY}
              disabled={
                !isValidCurrentPassword ||
                !isValidNewPassword ||
                !isValidPasswordConfirmation
              }
              loading={isLoading}
            >
              Update
            </Button>
          </form>
        </DialogBody>
      </Dialog>
    </>
  );
}
