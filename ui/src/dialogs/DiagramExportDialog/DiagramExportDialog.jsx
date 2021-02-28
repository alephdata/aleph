import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { Button, Card, Dialog, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { fetchDiagramEmbed } from 'actions';
import { showSuccessToast, showErrorToast } from 'app/toast';
import { ClipboardInput, EntitySet } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';


import './DiagramExportDialog.scss';

const messages = defineMessages({
  title: {
    id: 'diagram.export.title',
    defaultMessage: 'Export options',
  },
  embed_error: {
    id: 'diagram.export.error',
    defaultMessage: 'Error generating diagram embed',
  }
});

class DiagramExportDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      embedUrl: null
    }
  }

  fetchEmbedUrl = async () => {
    const { entitySet, intl } = this.props;

    try {
      const embedData = await this.props.fetchDiagramEmbed(entitySet.id);
      if (embedData?.url) {
        this.setState({ embedUrl: embedData.url });
      } else {
        throw intl.formatMessage(messages.embed_error);
      }
    } catch (e) {
      showErrorToast(e);
    }
  }

  generateIframeString = () => {
    const { entitySet } = this.props;
    const { embedUrl } = this.state;
    return `<iframe width="100%" height="100%" src=${embedUrl} title=${entitySet.label} style="border:none;"></iframe>`;
  }

  render() {
    const { entitySet, exportFtm, exportSvg, intl, isOpen, toggleDialog } = this.props;
    const { embedUrl } = this.state;

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
            <Button icon="image" onClick={() => { exportSvg(); toggleDialog(); }} >
              <FormattedMessage id="diagram.export.svg" defaultMessage="Export as SVG" />
            </Button>
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.svg.description"
                defaultMessage="Download a still image containing all of the contents of your diagram."
              />
            </p>
          </Card>

          <Card className="DiagramExportDialog__section">
            {!!embedUrl && (
              <div className="DiagramExportDialog__embed-code">
                <ClipboardInput icon="code" value={this.generateIframeString()} />
              </div>
            )}
            {!embedUrl && (
              <Button icon="code" onClick={this.fetchEmbedUrl} >
                <FormattedMessage id="diagram.export.iframe" defaultMessage="Embed iframe" />
              </Button>
            )}
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.svg.description"
                defaultMessage="Generate an interactive version of your diagram, allowing viewers to click and explore its contents."
              />
            </p>
          </Card>
          <Card className="DiagramExportDialog__section">
            <Button icon="offline" onClick={() => { exportFtm(); toggleDialog(); }} >
              <FormattedMessage id="diagram.export.ftm" defaultMessage="Export as .ftm" />
            </Button>
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.ftm.description"
                defaultMessage="Download your diagram as a file which can be edited offline in {link} or shared with colleagues outside of Aleph."
                values={{
                  link: (
                    <a
                      href="https://docs.alephdata.org/guide/aleph-data-desktop"
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
  withRouter,
  connect(null, { fetchDiagramEmbed }),
  injectIntl,
)(DiagramExportDialog);
