import React, { Component } from 'react';
import { Button, Card, Dialog, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { updateEntitySet } from 'actions';
import { showSuccessToast, showWarningToast } from 'app/toast';
import { EntitySet } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';

import './DiagramExportDialog.scss';

const messages = defineMessages({
  title: {
    id: 'diagram.export.title',
    defaultMessage: 'Export options',
  },
});

class DiagramExportDialog extends Component {
  constructor(props) {
    super(props);
  }

  exportIframe = () => {
    console.log('exporting iframe');
  }

  render() {
    const { entitySet, exportFtm, exportSvg, intl, isOpen, toggleDialog } = this.props;

    return (
      <Dialog
        icon="export"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title, {title: entitySet.label})}
        onClose={toggleDialog}
        className="DiagramExportDialog"
      >
        <div className="bp3-dialog-body">
          <Card className="DiagramExportDialog__section">
            <Button icon="image" onClick={() => { exportSvg(); toggleDialog(); }} intent={Intent.PRIMARY} outlined>
              <FormattedMessage id="diagram.export.svg" defaultMessage="Export SVG" />
            </Button>
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.svg.description"
                defaultMessage="A still image containing all of the contents of your diagram."
              />
            </p>
          </Card>
          <Card className="DiagramExportDialog__section">
            <Button icon="code" onClick={this.exportIframe} intent={Intent.PRIMARY} outlined>
              <FormattedMessage id="diagram.export.iframe" defaultMessage="Embed iframe" />
            </Button>
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.svg.description"
                defaultMessage="An interactive version of your diagram, allowing viewers to click and explore its contents."
              />
            </p>
          </Card>
          <Card className="DiagramExportDialog__section">
            <Button icon="offline" onClick={() => { exportFtm(); toggleDialog(); }} intent={Intent.PRIMARY} outlined>
              <FormattedMessage id="diagram.export.ftm" defaultMessage="Export .ftm" />
            </Button>
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.ftm.description"
                defaultMessage="A .ftm file, allowing you to continue editing your diagram offline in {link}, or to share your diagram with a colleague outside of Aleph."
                values={{
                  link: (
                    <a
                      href="https://https://docs.alephdata.org/guide/aleph-data-desktop"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FormattedMessage
                        id="diagram.export.ftm.link"
                        defaultMessage="Aleph Data Desktop"
                      />
                    </a>
                  ),
                }}
              />
            </p>
          </Card>
        </div>
      </Dialog>
    );
  }
}


export default compose(
  injectIntl,
)(DiagramExportDialog);
