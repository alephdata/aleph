import React from 'react';
import { AnchorButton, Button, ButtonGroup, Classes, Dialog, Icon, Intent, Tooltip, Position } from '@blueprintjs/core';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  download: {
    id: 'document.download',
    defaultMessage: 'Download',
  },
  mode_download: {
    id: 'document.download.tooltip',
    defaultMessage: 'Download the original document',
  },
  button_cancel: {
    id: 'document.download.cancel',
    defaultMessage: 'Cancel',
  },
  button_confirm: {
    id: 'document.download.confirm',
    defaultMessage: 'Download',
  },
});


class DownloadButton extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = { isOpen: false };

    this.toggleDialog = this.toggleDialog.bind(this);
  }
  toggleDialog() {
    this.setState(({ isOpen }) => ({
      isOpen: !isOpen,
    }));
  }
  render() {
    const { intl, document } = this.props;
    const { isOpen } = this.state;

    if (!document || !document.links || !document.links.file) {
      return null;
    }
    return (
      <>
        <Tooltip
          content={intl.formatMessage(messages.mode_download)}
          position={Position.BOTTOM_RIGHT}
        >
          <Button
            icon="download"
            text={intl.formatMessage(messages.download)}
            onClick={this.toggleDialog}
          />
        </Tooltip>
        <Dialog
          isOpen={isOpen}
          icon="download"
          className={Classes.ALERT}
        >
          <div className={Classes.ALERT_BODY}>
            <Icon icon="warning-sign" iconSize={40} intent={Intent.DANGER} />
            <div className={Classes.ALERT_CONTENTS}>
              <p>
                <FormattedMessage
                  id="document.download.warning"
                  defaultMessage={`
                    <bold>You’re about to download a source file.</bold>
                    {br}{br}
                    Source files can contain viruses and code that notify the originator when you open them.
                    {br}{br}
                    For sensitive data, we recommend only opening source files on a computer that is permanently disconnected from the internet.
                  `}
                  values={{
                    bold: (...chunks) => <b>{chunks}</b>,
                    br: <br />
                  }}
                />
              </p>
            </div>
          </div>
          <div className={Classes.ALERT_FOOTER}>
            <AnchorButton
              href={document.links.file}
              icon="download"
              download
              target="_blank"
              className="DownloadButton"
              rel="nofollow noopener noreferrer"
              text={intl.formatMessage(messages.button_confirm)}
              intent={Intent.DANGER}
              onClick={this.toggleDialog}
            />
            <Button
              onClick={this.toggleDialog}
              text={intl.formatMessage(messages.button_cancel)}
            />
          </div>
        </Dialog>
      </>
    );
  }
}

DownloadButton = injectIntl(DownloadButton);
export default DownloadButton;
