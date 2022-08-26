import * as React from 'react';
import { Dialog as Bp3Dialog, IconName, Spinner } from '@blueprintjs/core';
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
    const { children, className, isProcessing, ...rest } = this.props;

    return (
      <Bp3Dialog
        className={c('Dialog', className)}
        portalClassName="dialog-portal-container"
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
      </Bp3Dialog>
    );
  }
}
