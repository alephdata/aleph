import React from 'react';
import { Tooltip, Position } from '@blueprintjs/core';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import c from 'classnames';

const messages = defineMessages({
  mode_download: {
    id: 'document.download.tooltip',
    defaultMessage: 'Download the original document',
  },
});


class DownloadButton extends React.PureComponent {
  render() {
    const { intl, document, isPreview } = this.props;
    if (!document || !document.links || !document.links.file) {
      return null;
    }
    return (
      <Tooltip
        content={intl.formatMessage(messages.mode_download)}
        position={Position.BOTTOM_RIGHT}
      >
        <a href={document.links.file} download type="button" target="_blank" className={c('DownloadButton', 'bp3-button', { 'bp3-intent-primary': !isPreview })} rel="nofollow noopener noreferrer">
          <span className="bp3-icon-download left-icon" />
          <FormattedMessage id="document.download" defaultMessage="Download" />
        </a>
      </Tooltip>
    );
  }
}

DownloadButton = injectIntl(DownloadButton);
export default DownloadButton;
