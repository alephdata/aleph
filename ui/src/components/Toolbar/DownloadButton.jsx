// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { AnchorButton, Button, Callout, Checkbox, Classes, Dialog, Icon, Intent } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { dispatchSetConfigValue } from 'actions/configActions';

import './DownloadButton.scss';


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
  checkbox_label: {
    id: 'document.download.dont_warn',
    defaultMessage: "Don't warn me in the future when downloading source documents",
  },
});


class DownloadButton extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = { checkboxChecked: false, isOpen: false };

    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog() {
    this.setState(({ checkboxChecked, isOpen }) => {
      if (checkboxChecked) {
        this.props.dispatchSetConfigValue({ dontWarnOnDownload: true });
      }
      return ({
        isOpen: !isOpen,
      });
    });
  }

  toggleCheckbox() {
    this.setState(({ checkboxChecked }) => ({
      checkboxChecked: !checkboxChecked,
    }));
  }

  render() {
    const { intl, document, dontWarnOnDownload } = this.props;
    const { checkboxChecked, isOpen } = this.state;

    const file = document?.links?.file || document?.links?.csv;

    if (!file) {
      return null;
    }

    if (dontWarnOnDownload) {
      return (
        <Tooltip content={intl.formatMessage(messages.mode_download)}>
          <AnchorButton
            href={file}
            icon="download"
            download
            target="_blank"
            className="DownloadButton"
            rel="nofollow noopener noreferrer"
            text={intl.formatMessage(messages.download)}
          />
        </Tooltip>
      );
    }

    return (
      <>
        <Tooltip content={intl.formatMessage(messages.mode_download)}>
          <Button
            icon="download"
            text={intl.formatMessage(messages.download)}
            onClick={this.toggleDialog}
          />
        </Tooltip>
        <Dialog
          isOpen={isOpen}
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
              <Callout
                className="DownloadButton__checkbox-container"
              >
                <Checkbox
                  checked={checkboxChecked}
                  label={intl.formatMessage(messages.checkbox_label)}
                  onChange={this.toggleCheckbox}
                />
              </Callout>
            </div>
          </div>
          <div className={Classes.ALERT_FOOTER}>
            <AnchorButton
              href={file}
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
const mapStateToProps = ({ config }) => ({ dontWarnOnDownload: config.dontWarnOnDownload });
const mapDispatchToProps = { dispatchSetConfigValue };
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(DownloadButton);
