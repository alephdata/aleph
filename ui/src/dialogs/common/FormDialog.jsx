import React from 'react';
import { Dialog, Spinner } from '@blueprintjs/core';

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
          {processing && <Spinner className="FormDialog__spinner bp3-large" />}
        </form>
      </div>
    </Dialog>
  );
};

export default FormDialog;
