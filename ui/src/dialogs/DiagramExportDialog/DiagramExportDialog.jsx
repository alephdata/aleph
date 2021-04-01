import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { Button, Card, Dialog } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { fetchDiagramEmbed } from 'actions';
import { showErrorToast } from 'app/toast';
import { ClipboardInput } from 'components/common';


import './DiagramExportDialog.scss';
import { selectMetadata } from 'selectors';

const messages = defineMessages({
  title: {
    id: 'diagram.export.title',
    defaultMessage: 'Export options',
  },
  embed_error: {
    id: 'diagram.embed.error',
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
    return `<iframe width="100%" height="100%" src="${embedUrl}" title="${entitySet.label}" style="border:none;"></iframe>`;
  }

  render() {
    const { entitySet, exportFtm, exportSvg, intl, isOpen, canEmbed, toggleDialog } = this.props;
    const { embedUrl } = this.state;

    return (
      <Dialog
        icon="export"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title, { title: entitySet.label })}
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
                defaultMessage="Download a vector graphic with the contents of the diagram."
              />
            </p>
          </Card>

          {canEmbed && (
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
                  id="diagram.export.embed.description"
                  defaultMessage="Generate an embeddable interactive version of the diagram that can be used in an article. The embed will not reflect future changes in the diagram."
                />
              </p>
            </Card>
          )}

          <Card className="DiagramExportDialog__section">
            <Button icon="offline" onClick={() => { exportFtm(); toggleDialog(); }} >
              <FormattedMessage id="diagram.export.ftm" defaultMessage="Export as .ftm" />
            </Button>
            <p className="bp3-text-muted">
              <FormattedMessage
                id="diagram.export.ftm.description"
                defaultMessage="Download the diagram as a data file that can be used in {link} or another Aleph site."
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


const mapStateToProps = (state, ownProps) => {
  const metadata = selectMetadata(state);
  return { canEmbed: metadata.app.publish };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchDiagramEmbed }),
  injectIntl,
)(DiagramExportDialog);
