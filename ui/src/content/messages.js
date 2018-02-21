import {defineMessages} from 'react-intl';

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
    no_route_error: {
      id: 'status.no_route_error',
      defaultMessage: 'No such page: {path}'
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
  signup: {
    not_available: {
      title: {
        id: 'signup.not_available.title',
        defaultMessage: 'Registration is disabled'
      },
      desc: {
        id: 'signup.not_available.desc',
        defaultMessage: 'Please contact the site admin to get an account'
      }
    },
    submitted: {
      title: {
        id: 'signup.submitted.title',
        defaultMessage: 'Check your inbox'
      },
      desc: {
        id: 'signup.submitted.desc',
        defaultMessage: 'To proceed with sign up, please check your email.'
      }
    }
  },
  search: {
    filter: {
      addAFilter: {
        id: 'search.filter.addAFilter',
        defaultMessage: 'Add a filter'
      },
      schema: {
        id: 'search.filter.schema',
        defaultMessage: 'Types'
      },
      collection_id: {
        id: 'search.filter.collection_id',
        defaultMessage: 'Collections'
      },
      languages: {
        id: 'search.filter.languages',
        defaultMessage: 'Languages'
      },
      emails: {
        id: 'search.filter.emails',
        defaultMessage: 'Emails'
      },
      phones: {
        id: 'search.filter.phones',
        defaultMessage: 'Phones'
      },
      countries: {
        id: 'search.filter.countries',
        defaultMessage: 'Countries'
      },
      names: {
        id: 'search.filter.names',
        defaultMessage: 'Names'
      },
      addresses: {
        id: 'search.filter.addresses',
        defaultMessage: 'Addresses'
      },
      mime_type: {
        id: 'search.filter.mime_type',
        defaultMessage: 'File types'
      },
      author: {
        id: 'search.filter.author',
        defaultMessage: 'Authors'
      },
    }
  },
  entity: {
    list: {
      name: {
        id: 'entity.list.names',
        defaultMessage: 'Names'
      },
      collection_id: {
        id: 'entity.list.collection_id',
        defaultMessage: 'Collections'
      },
      schema: {
        id: 'entity.list.schema',
        defaultMessage: 'Type'
      },
      countries: {
        id: 'entity.list.countries',
        defaultMessage: 'Countries'
      },
      dates: {
        id: 'entity.list.dates',
        defaultMessage: 'Date'
      },
    }
  }
};

messages = defineMessages(messages);
export default messages;
