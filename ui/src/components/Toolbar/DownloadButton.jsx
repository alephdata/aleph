import React from 'react';
import { Tooltip, Position } from '@blueprintjs/core';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  mode_download: {
    id: 'document.download.tooltip',
    defaultMessage: 'Download the original document',
  },
});


class DownloadButton extends React.Component {
  render() {
    const { intl, document } = this.props;
    if (document.links === undefined || document.links.file === undefined) {
      return null;
    }
    return (
      <Tooltip
        content={intl.formatMessage(messages.mode_download)}
        position={Position.BOTTOM_RIGHT}
      >
        <a href={document.links.file} download type="button" target="_blank" className="DownloadButton bp3-button bp3-intent-primary" rel="nofollow noopener noreferrer">
          <span className="bp3-icon-standard bp3-icon-download" />
          <FormattedMessage id="document.download" defaultMessage="Download" />
        </a>
      </Tooltip>
    );
  }
}

DownloadButton = injectIntl(DownloadButton);
export default DownloadButton;
