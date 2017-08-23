import {defineMessages} from "react-intl";

let messages = {
  status: {
    bad_request: {
      id: 'status.bad_request',
      defaultMessage: 'The Server did not accept your input'
    },
    unauthorized: {
      id: 'status.unauthorized',
      defaultMessage: 'Not authorized'
    },
    wrong_credentials: {
      id: 'status.wrong_credentials',
      defaultMessage: 'Wrong credentials'
    },
    server_error: {
      id: 'status.server_error',
      defaultMessage: 'Server error'
    },
    unknown_error: {
      id: 'status.unknown_error',
      defaultMessage: 'An unexpected error occured'
    },
    success: {
      id: 'status.success',
      defaultMessage: 'Success'
    }
  }
};

messages = defineMessages(messages);
export default messages;
