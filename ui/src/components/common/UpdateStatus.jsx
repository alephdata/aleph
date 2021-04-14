import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Prompt, withRouter } from 'react-router';
import { Intent, Spinner, Tag } from '@blueprintjs/core';

const messages = defineMessages({
  status_success: {
    id: 'entity.status.success',
    defaultMessage: 'Saved',
  },
  status_error: {
    id: 'entity.status.error',
    defaultMessage: 'Error saving',
  },
  status_in_progress: {
    id: 'entity.status.in_progress',
    defaultMessage: 'Saving...',
  },
  error_warning: {
    id: 'entity.status.error_warning',
    defaultMessage: 'There was an error saving your latest changes, are you sure you want to leave?',
  },
  in_progress_warning: {
    id: 'entity.status.in_progress_warning',
    defaultMessage: 'Changes are still being saved, are you sure you want to leave?',
  },
});

class UpdateStatus extends PureComponent {
  static SUCCESS = 'SUCCESS';
  static ERROR = 'ERROR';
  static IN_PROGRESS = 'IN_PROGRESS';

  getStatusValue() {
    switch (this.props.status) {
      case 'IN_PROGRESS':
        return ({
          text: messages.status_in_progress,
          intent: Intent.PRIMARY,
          icon: <Spinner size="16" intent={Intent.PRIMARY} />
        });
      case 'ERROR':
        return ({
          text: messages.status_error,
          intent: Intent.DANGER,
          icon: 'error'
        });
      default:
        return ({
          text: messages.status_success,
          intent: Intent.SUCCESS,
          icon: 'tick'
        });
    }
  }

  showPrompt(location) {
    const { pathname } = window.location;
    return location.pathname !== pathname
  }

  render() {
    const { intl, status } = this.props;
    const { text, intent, icon } = this.getStatusValue();

    return (
      <>
        <Prompt
          when={status === 'IN_PROGRESS'}
          message={location => {
            if (this.showPrompt(location)) {
              return intl.formatMessage(messages.in_progress_warning);
            }
          }}
        />
        <Prompt
          when={status === 'ERROR'}
          message={location => {
            if (this.showPrompt(location)) {
              return intl.formatMessage(messages.error_warning);
            }
          }}
        />
        <Tag large minimal intent={intent} className="UpdateStatus" icon={icon}>
          {intl.formatMessage(text)}
        </Tag>
      </>
    );
  }
}

export default compose(
  withRouter,
  injectIntl
)(UpdateStatus);
