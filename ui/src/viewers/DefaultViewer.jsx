import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';

import { ErrorSection } from 'src/components/common';

const messages = defineMessages({
  no_viewer: {
    id: 'document.viewer.no_viewer',
    defaultMessage: 'No preview is available for this document',
  },
  ignored_file: {
    id: 'document.viewer.ignored_file',
    defaultMessage: 'The system does not work with these types of files. Please download it so you’ll be able to see it.',
  },
});

@injectIntl
export default class DefaultViewer extends React.Component {
  render() {
    const { intl, document } = this.props;
    const message = document.error_message || intl.formatMessage(messages.ignored_file);
    return (
      <ErrorSection
        visual="issue"
        title={intl.formatMessage(messages.no_viewer)}
        description={message}
      />
    );
  }
}
