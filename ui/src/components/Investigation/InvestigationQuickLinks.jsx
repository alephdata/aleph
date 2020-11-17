import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { DialogToggleButton } from 'components/Toolbar';
import DocumentUploadDialog from 'dialogs/DocumentUploadDialog/DocumentUploadDialog';
import EntitySetCreateDialog from 'dialogs/EntitySetCreateDialog/EntitySetCreateDialog';
import CollectionAccessDialog from 'dialogs/CollectionAccessDialog/CollectionAccessDialog';

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
          <img src="/static/home_networks.svg" />
          <p className="InvestigationQuickLinks__item__text">
            Create a network diagram
          </p>
        </div>
        <div className="InvestigationQuickLinks__item">
          <img src="/static/home_documents.svg" />
          <p className="InvestigationQuickLinks__item__text">
            Upload documents
          </p>
        </div>
        <div className="InvestigationQuickLinks__item">
          <img src="/static/home_xref.svg" />
          <p className="InvestigationQuickLinks__item__text">
            Compare with other datasets
          </p>

        </div>

      </div>
    )
  }
}

export default injectIntl(InvestigationQuickLinks);
