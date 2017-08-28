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
    logout_success: {
      id: 'status.logout_success',
      defaultMessage: 'Logout successful'
    },
    success: {
      id: 'status.success',
      defaultMessage: 'Success'
    }
  },
  login: {
    not_available: {
      title: {
        id: 'login.not_available.title',
        defaultMessage: 'Login is disabled'
      },
      desc: {
        id: 'login.not_available.desc',
        defaultMessage: 'There is no login provider configured for this app'
      }
    },
    already_logged_in: {
      title: {
        id: 'login.already_logged_in.title',
        defaultMessage: 'You are already logged in'
      },
      desc: {
        id: 'login.already_logged_in.desc',
        defaultMessage: 'Go ahead and use the app!'
      }
    }
  },
  invite: {
    not_available: {
      title: {
        id: 'invite.not_available.title',
        defaultMessage: 'Registration is disabled'
      },
      desc: {
        id: 'invite.not_available.desc',
        defaultMessage: 'Please contact the site admin to get an account'
      }
    },
    submitted: {
      title: {
        id: 'invite.submitted.title',
        defaultMessage: 'Check your inbox'
      },
      desc: {
        id: 'invite.submitted.desc',
        defaultMessage: 'To proceed with sign up, please check your email.'
      }
    }
  }
};

messages = defineMessages(messages);
export default messages;
