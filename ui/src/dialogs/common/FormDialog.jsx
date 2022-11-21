import React from 'react';
import c from 'classnames';
import { Classes, Dialog, Spinner } from '@blueprintjs/core';

import './FormDialog.scss';

const FormDialog = ({ processing, children, onSubmit, ...rest }) => {
  const onSubmitForm = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!processing) onSubmit();
  };

  return (
    <Dialog {...rest}>
      <div className="FormDialog__content">
        <form onSubmit={!!onSubmit ? onSubmitForm : undefined}>
          {processing && <div className="FormDialog__overlay" />}
          {children}
          {processing && (
            <Spinner className={c('FormDialog__spinner', Classes.LARGE)} />
          )}
        </form>
      </div>
    </Dialog>
  );
};

export default FormDialog;
