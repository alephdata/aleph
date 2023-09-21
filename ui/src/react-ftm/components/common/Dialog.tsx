import * as React from 'react';
import { Dialog as BpDialog, IconName, Spinner } from '@blueprintjs/core';
import c from 'classnames';

import './Dialog.scss';

interface IDialogProps {
  icon: IconName;
  isOpen: boolean;
  isProcessing: boolean;
  title: string;
  onClose: () => any;
  className?: string;
}

export class Dialog extends React.Component<IDialogProps> {
  render() {
    const { children, className, isProcessing, onClose, ...rest } = this.props;

    return (
      <BpDialog
        className={c('Dialog', className)}
        portalClassName="dialog-portal-container"
        onClose={onClose}
        canOutsideClickClose={false}
        backdropProps={{
          onClick: (event) => {
            // When a user double click to open a dialog, this may actually lead to the
            // dialog being closed immediately. The first click opens the dialog, the second
            // click target the dialog's backdrop, causing it to be closed. However, we can
            // check whether a click event is the first or the second click using `event.detail`:
            // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail
            if (event.detail === 1) {
              onClose();
            }
          },
        }}
        {...rest}
      >
        <div className={c('Dialog__content', isProcessing)}>
          {children}
          {isProcessing && (
            <div className="Dialog__loading-overlay">
              <Spinner />
            </div>
          )}
        </div>
      </BpDialog>
    );
  }
}
