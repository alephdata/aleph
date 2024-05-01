import { useReducer } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Intent, Dialog, DialogBody, Card } from '@blueprintjs/core';
import { ClipboardInput } from 'components/common';
import { selectCurrentRole } from 'selectors';
import { resetApiKey } from 'actions';
import { FormattedMessage } from 'react-intl';

const GENERATE_MESSAGE = (
  <FormattedMessage
    id="settings.api_key.generate"
    defaultMessage="Generate API key"
  />
);

const REGENERATE_MESSAGE = (
  <FormattedMessage
    id="settings.api_key.regenerate"
    defaultMessage="Regenerate API key"
  />
);

type State = {
  state:
    | 'START'
    | 'REGENERATE_CONFIRMATION'
    | 'REGENERATE_LOADING'
    | 'REGENERATE_DONE'
    | 'GENERATE_LOADING'
    | 'GENERATE_DONE';
  apiKey?: string;
};

type RegenerateConfirmAction = { type: 'REGENERATE_CONFIRM' };
type RegenerateStartAction = { type: 'REGENERATE_START' };
type RegenerateEndAction = { type: 'REGENERATE_END'; apiKey: string };
type GenerateStartAction = { type: 'GENERATE_START' };
type GenerateEndAction = { type: 'GENERATE_END'; apiKey: string };
type CloseAction = { type: 'CLOSE' };

type Action =
  | RegenerateConfirmAction
  | RegenerateStartAction
  | RegenerateEndAction
  | GenerateStartAction
  | GenerateEndAction
  | CloseAction;

const STATE_TRANSITIONS: Record<Action['type'], State['state']> = {
  REGENERATE_CONFIRM: 'REGENERATE_CONFIRMATION',
  REGENERATE_START: 'REGENERATE_LOADING',
  REGENERATE_END: 'REGENERATE_DONE',
  GENERATE_START: 'GENERATE_LOADING',
  GENERATE_END: 'GENERATE_DONE',
  CLOSE: 'START',
};

function reducer(current: State, action: Action): State {
  const next = {
    state: STATE_TRANSITIONS[action.type],
    apiKey: current.apiKey,
  };

  if (action.type === 'REGENERATE_END' || action.type === 'GENERATE_END') {
    next.apiKey = action.apiKey;
  }

  if (action.type === 'CLOSE') {
    next.apiKey = undefined;
  }

  return next;
}

export default function ApiKeySettings() {
  const reduxDispatch = useDispatch<any>();

  const role = useSelector(selectCurrentRole);
  const [{ state, apiKey }, dispatch] = useReducer(reducer, { state: 'START' });

  const generateApiKey = async () => {
    const { data } = await reduxDispatch(resetApiKey(role));
    return data.api_key;
  };

  const onGenerate = async () => {
    dispatch({ type: 'GENERATE_START' });
    const apiKey = await generateApiKey();
    dispatch({ type: 'GENERATE_END', apiKey });
  };

  const onRegenerate = () => {
    dispatch({ type: 'REGENERATE_CONFIRM' });
  };

  const onConfirm = async () => {
    dispatch({ type: 'REGENERATE_START' });
    const apiKey = await generateApiKey();
    dispatch({ type: 'REGENERATE_END', apiKey });
  };

  const onClose = async () => {
    dispatch({ type: 'CLOSE' });
  };

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
          {role.has_api_key ? (
            <FormattedMessage
              id="settings.api_key.text_regenerate"
              defaultMessage="Your API key is required to access the Aleph API. When you regenerate your API key, your old key will stop working."
            />
          ) : (
            <FormattedMessage
              id="settings.api_key.text_generate"
              defaultMessage="You need an API key in order to access the Aleph API. Generate an API key to get started."
            />
          )}
        </p>

        <Button
          loading={state === 'GENERATE_LOADING'}
          onClick={role.has_api_key ? onRegenerate : onGenerate}
        >
          {role.has_api_key ? REGENERATE_MESSAGE : GENERATE_MESSAGE}
        </Button>
      </Card>

      <ApiKeyDialog
        state={state}
        apiKey={apiKey}
        isOpen={state !== 'START' && state !== 'GENERATE_LOADING'}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </>
  );
}

type ApiKeyDialogProps = {
  state: State['state'];
  apiKey?: string;
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function ApiKeyDialog({
  state,
  apiKey,
  isOpen,
  onConfirm,
  onClose,
}: ApiKeyDialogProps) {
  if (state === 'REGENERATE_CONFIRMATION' || state === 'REGENERATE_LOADING') {
    return (
      <Dialog title={REGENERATE_MESSAGE} isOpen={isOpen} onClose={onClose}>
        <DialogBody>
          <p>
            <FormattedMessage
              id="settings.api_key.confirm_regenerate"
              defaultMessage="You are about to regenerate your API key. When you regenerate your API key, your old key will stop working. If you are currently using your API key in applications or scripts, you will need to update them to keep them working."
            />
          </p>
          <Button
            intent={Intent.DANGER}
            onClick={onConfirm}
            fill
            loading={state === 'REGENERATE_LOADING'}
          >
            {REGENERATE_MESSAGE}
          </Button>
        </DialogBody>
      </Dialog>
    );
  }

  const title =
    state === 'REGENERATE_DONE' ? REGENERATE_MESSAGE : GENERATE_MESSAGE;

  return (
    <Dialog
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      canOutsideClickClose={false}
    >
      <DialogBody>
        <p>
          <FormattedMessage
            id="settings.api_key.success"
            defaultMessage="Your new API key has been generated. Be sure to copy it below as you won’t be able to view it again later. We recommend storing your API key in a password manager. Do not share your API key with anyone else."
          />
        </p>
        <p>
          <label>
            <span className="visually-hidden">API key</span>
            <ClipboardInput disabled icon="key" value={apiKey} large />
          </label>
        </p>
      </DialogBody>
    </Dialog>
  );
}
