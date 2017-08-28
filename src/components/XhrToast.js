import {showErrorToast, showSuccessToast} from "./Toast";
import messages from "../messages";

const defaultStatusMap = {
  400: messages.status.bad_request,
  401: messages.status.unauthorized,
  500: messages.status.server_error
};

export const xhrToast = (response, intl, statusMap, showToastFn, fallbackMessageKey) => {
  if (!statusMap) statusMap = {};
  statusMap = Object.assign({}, defaultStatusMap, statusMap);
  let messageKey = fallbackMessageKey;
  if (response && statusMap[response.status]) {
    messageKey = statusMap[response.status];
  }
  showToastFn(intl.formatMessage(messageKey));
};

export const xhrErrorToast = (response, intl, statusMap) => xhrToast(response, intl, statusMap, showErrorToast, messages.status.unknown_error);

export const xhrSuccessToast = (response, intl, statusMap) => xhrToast(response, intl, statusMap, showSuccessToast, messages.status.success);
