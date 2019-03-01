import React from 'react';
import { Tooltip, Position } from '@blueprintjs/core';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  mode_download: {
    id: 'document.download.tooltip',
    defaultMessage: 'Download the original document',
  },
});

/* eslint-disable */

class DownloadButton extends React.Component {
  render() {
    const { intl, document } = this.props;

    const content = (
      <React.Fragment>
        <span className="bp3-icon-standard bp3-icon-download" />
        <span>
          <FormattedMessage id="document.download" defaultMessage="Download" />
        </span>
      </React.Fragment>
    );

    if (document.links !== undefined && document.links.file !== undefined) {
      return (
        <Tooltip content={intl.formatMessage(messages.mode_download)} position={Position.BOTTOM_RIGHT}>
          <a href={document.links.file} download type="button" target="_blank" className="DownloadButton bp3-button" rel="nofollow noopener noreferrer">
            {content}
          </a>
        </Tooltip>
      );
    }
    // Render disabled control
    return (
      <Tooltip content={intl.formatMessage(messages.mode_download)} position={Position.BOTTOM_RIGHT}>
        <button type="button" className="DownloadButton bp3-button" disabled>
          {content}
        </button>
      </Tooltip>
    );
  }
}

DownloadButton = injectIntl(DownloadButton);
export default DownloadButton;
