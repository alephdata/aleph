// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
          {processing && (
            <Spinner className="FormDialog__spinner bp3-large" />
          )}
        </form>
      </div>
    </Dialog>
  );
};

export default FormDialog;
