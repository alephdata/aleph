import React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { Schema } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import DocumentUploadDialog from 'dialogs/DocumentUploadDialog/DocumentUploadDialog';
import EntitySetCreateDialog from 'dialogs/EntitySetCreateDialog/EntitySetCreateDialog';
import CollectionXrefDialog from 'dialogs/CollectionXrefDialog/CollectionXrefDialog';


import './InvestigationQuickLinks.scss'

const messages = defineMessages({
  diagram: {
    id: 'investigation.shortcut.daigram',
    defaultMessage: 'Create a network diagram',
  },
  upload: {
    id: 'investigation.shortcut.upload',
    defaultMessage: 'Upload documents',
  },
  share: {
    id: 'investigation.shortcut.share',
    defaultMessage: 'Share with others',
  },
});


class InvestigationQuickLinks extends React.Component {
  onSchemaSelect = (schema) => {
    const { history, location } = this.props;
    console.log('in schema select', schema)
    history.push({
      pathname: location.pathname,
      hash: queryString.stringify({ mode: 'entities', type: schema.name }),
    });
  }

  onXrefSubmit = () => {
    const { history, location } = this.props;
    console.log('in redirect')
    history.push({
      pathname: location.pathname,
      hash: queryString.stringify({ mode: 'xref' }),
    });
  }
  // <DialogToggleButton
  //   buttonProps={{
  //     text: intl.formatMessage(messages.upload),
  //     icon: "upload",
  //     outlined: true,
  //   }}
  //   Dialog={DocumentUploadDialog}
  //   dialogProps={{ collection }}
  // />
  // <DialogToggleButton
  //   buttonProps={{
  //     text: intl.formatMessage(messages.diagram),
  //     icon: "graph",
  //     outlined: true,
  //   }}
  //   Dialog={EntitySetCreateDialog}
  //   dialogProps={{ entitySet: { collection, type: 'diagram' }, canChangeCollection: false }}
  // />
  // <Button icon="comparison" outlined>
  //   <FormattedMessage id="investigation.shortcut.upload" defaultMessage="Cross-reference with other datasets" />
  // </Button>
  render() {
    const { collection, intl } = this.props;
    return (
      <div className="InvestigationQuickLinks">
        <div className="InvestigationQuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: "InvestigationQuickLinks__item__content"
            }}
            Dialog={DocumentUploadDialog}
            dialogProps={{ collection }}
          >
            <>
              <div className="InvestigationQuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_documents.svg)' }} />
              <p className="InvestigationQuickLinks__item__text">
                Upload documents
              </p>
            </>
          </DialogToggleButton>
        </div>
        <div className="InvestigationQuickLinks__item">
          <div className="InvestigationQuickLinks__item__content">
            <Schema.Select
              onSelect={this.onSchemaSelect}
              fill
              optionsFilter={schema => !schema.isDocument()}
            >
                <div className="InvestigationQuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_documents.svg)' }} />
                <p className="InvestigationQuickLinks__item__text">
                  Create new entities
                </p>
            </Schema.Select>
          </div>
        </div>
        <div className="InvestigationQuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: "InvestigationQuickLinks__item__content"
            }}
            Dialog={EntitySetCreateDialog}
            dialogProps={{ entitySet: { collection, type: 'diagram' }, canChangeCollection: false }}
          >
            <>
              <div className="InvestigationQuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_networks.svg)' }} />
              <p className="InvestigationQuickLinks__item__text">
                Sketch out a network diagram
              </p>
            </>
          </DialogToggleButton>
        </div>
        <div className="InvestigationQuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: "InvestigationQuickLinks__item__content"
            }}
            Dialog={CollectionXrefDialog}
            dialogProps={{ collection, redirectOnSubmit: this.onXrefSubmit }}
          >
            <>
              <div className="InvestigationQuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_xref.svg)' }} />
              <p className="InvestigationQuickLinks__item__text">
                Compare with other datasets
              </p>
            </>
          </DialogToggleButton>
        </div>
      </div>
    )
  }
}

export default compose(
  withRouter,
  injectIntl,
)(InvestigationQuickLinks);
