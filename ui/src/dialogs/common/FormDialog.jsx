import React from 'react';
import { Dialog, Spinner } from '@blueprintjs/core';

import './FormDialog.scss';

const FormDialog = ({ processing, children, ...rest }) => (
  <Dialog
    {...rest}
  >
    <div className="FormDialog__content">
      {processing && <div className="FormDialog__overlay" />}
      {children}
      {processing && (
        <Spinner className="FormDialog__spinner bp3-large" />
      )}
    </div>
  </Dialog>
);

export default FormDialog;
