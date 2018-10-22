import React from 'react';
import { Tooltip, Position } from '@blueprintjs/core';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  mode_download: {
    id: 'document.download.tooltip',
    defaultMessage: 'Download the original document',
  }
});


class DownloadButton extends React.Component {
  render() {
    const { intl, document } = this.props;

    const content = <React.Fragment>
      <span className="pt-icon-standard pt-icon-download"/>
      <span>
        <FormattedMessage id="document.download" defaultMessage="Download"/>
      </span>
    </React.Fragment>;

    if (document.links !== undefined && document.links.file !== undefined) {
      return (
        <Tooltip content={intl.formatMessage(messages.mode_download)} position={Position.BOTTOM_RIGHT}>
          <a href={document.links.file} download type="button" target="_blank" className="DownloadButton pt-button" rel="nofollow">
            {content}
          </a>
        </Tooltip>
      );
    } else {
      // Render disabled control
      return (
        <Tooltip content={intl.formatMessage(messages.mode_download)} position={Position.BOTTOM_RIGHT}>
          <button type="button" className="DownloadButton pt-button" disabled>
            {content}
          </button>
        </Tooltip>
      );
    }
  }
}

DownloadButton = injectIntl(DownloadButton);
export default DownloadButton;
