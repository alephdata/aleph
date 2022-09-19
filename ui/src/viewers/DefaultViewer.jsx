import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';

import { ErrorSection } from 'components/common';

const messages = defineMessages({
  no_viewer: {
    id: 'document.viewer.no_viewer',
    defaultMessage: 'No preview is available for this document',
  },
  ignored_file: {
    id: 'document.viewer.ignored_file',
    defaultMessage:
      'The system does not work with these types of files. Please download it so you’ll be able to see it.',
  },
});

export class DefaultViewer extends PureComponent {
  render() {
    const { intl, document } = this.props;
    const backendMessage = document.getProperty('processingError').join(', ');
    const message = backendMessage || intl.formatMessage(messages.ignored_file);
    return (
      <ErrorSection
        icon="issue"
        title={intl.formatMessage(messages.no_viewer)}
        description={message}
      />
    );
  }
}

export default injectIntl(DefaultViewer);
