import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Intent, Dialog, DialogBody, Card } from '@blueprintjs/core';
import { ClipboardInput } from 'components/common';
import { selectCurrentRole } from 'selectors';
import { resetApiKey } from 'actions';
import { FormattedMessage } from 'react-intl';

export default function ApiKeySettings() {
  const dispatch = useDispatch();
  const role = useSelector(selectCurrentRole);

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [apiKey, setApiKey] = useState(null);

  const onReset = async () => {
    setIsLoading(true);
    const { data } = await dispatch(resetApiKey(role));
    setApiKey(data.api_key);
    setIsLoading(false);
  };

  const onClose = async () => {
    setShowConfirmation(false);
    setApiKey(null);
  };

  const resetMessage = (
    <FormattedMessage
      id="settings.api_key.reset"
      defaultMessage="Reset API key"
    />
  );

  return (
    <>
      <Card elevation={1}>
        <h4 className="bp4-heading">
          <FormattedMessage
            id="settings.api_key.title"
            defaultMessage="API key"
          />
        </h4>

        <p>
          <FormattedMessage
            id="settings.api_key.text"
            defaultMessage="Your API key is required to access the Aleph API. When you reset your API key, your old key will stop working."
          />
        </p>

        <Button onClick={() => setShowConfirmation(true)}>
          {resetMessage}
        </Button>
      </Card>

      <Dialog
        title={resetMessage}
        isOpen={showConfirmation}
        onClose={onClose}
        canOutsideClickClose={apiKey ? false : true}
      >
        {apiKey === null ? (
          <DialogBody>
            <p>
              <FormattedMessage
                id="settings.api_key.confirm"
                defaultMessage="You are about to reset your API key. When you reset your API key, your old key will stop working. If you are currently using your API key in applications or scripts, you will need to update them to keep them working."
              />
            </p>
            <Button
              intent={Intent.DANGER}
              onClick={onReset}
              fill
              loading={isLoading}
            >
              {resetMessage}
            </Button>
          </DialogBody>
        ) : (
          <DialogBody>
            <p>
              <FormattedMessage
                id="settings.api_key.success"
                defaultMessage="Your API key has been reset. Be sure to copy your new key below. You won’t be able to view it again later."
              />
            </p>
            <p>
              <label>
                <span className="visually-hidden">API key</span>
                <ClipboardInput disabled icon="key" value={apiKey} large />
              </label>
            </p>
          </DialogBody>
        )}
      </Dialog>
    </>
  );
}
