// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { defineMessages } from 'react-intl';
import { Intent, Position, Toaster } from '@blueprintjs/core';

const messages = defineMessages({
  bad_request: {
    id: 'auth.bad_request',
    defaultMessage: 'The Server did not accept your input',
  },
  unauthorized: {
    id: 'auth.unauthorized',
    defaultMessage: 'Not authorized',
  },
  server_error: {
    id: 'auth.server_error',
    defaultMessage: 'Server error',
  },
  unknown_error: {
    id: 'auth.unknown_error',
    defaultMessage: 'An unexpected error occured',
  },
  success: {
    id: 'auth.success',
    defaultMessage: 'Success',
  },
});

const statusMessages = {
  200: messages.success,
  201: messages.success,
  204: messages.success,
  400: messages.bad_request,
  401: messages.unauthorized,
  500: messages.server_error,
};

export const toaster = Toaster.create({
  position: Position.TOP,
  className: 'aleph-toaster',
});

const showToast = (userProps, intentProps) => {
  let userPropsConfig;
  if (typeof userProps === 'string') userPropsConfig = { message: userProps };
  else userPropsConfig = userProps;
  toaster.show({ ...intentProps, ...userPropsConfig });
};

export const showInfoToast = props => showToast(props, {
  intent: Intent.PRIMARY,
  icon: 'info-sign',
});

export const showSuccessToast = props => showToast(props, {
  intent: Intent.SUCCESS,
  icon: 'tick',
});

export const showWarningToast = props => showToast(props, {
  intent: Intent.WARNING,
  icon: 'warning-sign',
});

export const showErrorToast = props => showToast(props, {
  intent: Intent.DANGER,
  icon: 'error',
});

const translateMessage = (message, intl) => {
  if (intl) {
    return intl.formatMessage(message);
  }
  return message.defaultMessage;
};

export const showResponseToast = (response, intl) => {
  if (!response || !response.status) {
    return showWarningToast(translateMessage(messages.unknown_error, intl));
  }
  const errorFunction = response.status > 499 ? showErrorToast : showWarningToast;
  const toastFunction = response.status > 399 ? errorFunction : showSuccessToast;
  if (response && response.data && response.data.message) {
    return toastFunction(response.data.message);
  }
  const message = statusMessages[response.status] || messages.unknown_error;
  return toastFunction(translateMessage(message, intl));
};
