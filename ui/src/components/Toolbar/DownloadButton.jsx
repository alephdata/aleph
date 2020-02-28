import React from 'react';
import { AnchorButton, Icon, Tooltip, Position } from '@blueprintjs/core';
import { injectIntl, defineMessages } from 'react-intl';
import c from 'classnames';

const messages = defineMessages({
  download: {
    id: 'document.download',
    defaultMessage: 'Download',
  },
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
        <AnchorButton
          href={document.links.file}
          icon="download"
          download
          target="_blank"
          className='DownloadButton'
          rel="nofollow noopener noreferrer"
          text={intl.formatMessage(messages.download)}
        />
      </Tooltip>
    );
  }
}

DownloadButton = injectIntl(DownloadButton);
export default DownloadButton;
