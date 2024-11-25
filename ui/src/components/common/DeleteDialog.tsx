import { FC, ReactNode, useState } from 'react';
import {
  Dialog,
  DialogBody,
  Button,
  Intent,
  FormGroup,
  InputGroup,
} from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

type DeleteDialogProps = {
  title: ReactNode;
  children: ReactNode;
  buttonLabel: ReactNode;
  expectedConfirmationValue: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
};

const DeleteDialog: FC<DeleteDialogProps> = ({
  title,
  children,
  buttonLabel,
  expectedConfirmationValue,
  isOpen,
  onClose,
  onDelete,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [confirmationValue, setConfirmationValue] = useState<string>('');
  const enabled = confirmationValue.toLowerCase().trim() === expectedConfirmationValue.toLowerCase().trim();

  return (
    <Dialog isOpen={isOpen} title={title} icon="trash" onClose={onClose}>
      <DialogBody>
        {children}

        <p>
          <FormattedMessage
            id="delete_dialog.enter_label"
            defaultMessage="Please enter {expectedConfirmationValue} to confirm:"
            values={{
              expectedConfirmationValue: (
                <strong>{expectedConfirmationValue}</strong>
              ),
            }}
          />
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setIsLoading(true);
            onDelete();
          }}
        >
          <FormGroup
            labelFor="delete-dialog-confirmation"
            label={
              <span className="visually-hidden">
                <FormattedMessage
                  id="delete_dialog.confirmation_label"
                  defaultMessage="Confirmation"
                />
              </span>
            }
          >
            <InputGroup
              id="delete-dialog-confirmation"
              placeholder={expectedConfirmationValue}
              required
              autoComplete="off"
              onInput={(event) =>
                setConfirmationValue(event.currentTarget.value)
              }
            />
          </FormGroup>
          <Button
            type="submit"
            intent={Intent.DANGER}
            fill
            disabled={!enabled}
            loading={isLoading}
          >
            {buttonLabel}
          </Button>
        </form>
      </DialogBody>
    </Dialog>
  );
};

export default DeleteDialog;
