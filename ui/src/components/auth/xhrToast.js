import { defineMessages } from 'react-intl';

import { showErrorToast, showSuccessToast } from 'src/app/toast';

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

const defaultStatusMap = {
  400: messages.bad_request,
  401: messages.unauthorized,
  500: messages.server_error,
};

const xhrToastFn = (showToastFn, fallbackMessageKey) => (response, intl, statusMap = {}) => {
  if (response && response.data && response.data.message) {
    showToastFn(response.data.message);
  } else {
    const messageKey = response && (
      statusMap[response.status] || defaultStatusMap[response.status]
    );
    showToastFn(intl.formatMessage(messageKey || fallbackMessageKey));
  }
};

export const xhrErrorToast = xhrToastFn(showErrorToast, messages.unknown_error);
export const xhrSuccessToast = xhrToastFn(showSuccessToast, messages.success);
