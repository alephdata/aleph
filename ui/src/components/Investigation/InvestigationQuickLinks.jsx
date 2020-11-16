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


// import './InvestigationQuickLinks.scss'

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
  render() {
    const { collection, intl } = this.props;
    return (
      <ButtonGroup className="InvestigationQuickLinks">
        <DialogToggleButton
          buttonProps={{
            text: intl.formatMessage(messages.upload),
            icon: "upload"
          }}
          Dialog={DocumentUploadDialog}
          dialogProps={{ collection }}
        />
        <DialogToggleButton
          buttonProps={{
            text: intl.formatMessage(messages.diagram),
            icon: "graph"
          }}
          Dialog={EntitySetCreateDialog}
          dialogProps={{ entitySet: { collection, type: 'diagram' }, canChangeCollection: false }}
        />
        <Button icon="comparison">
          <FormattedMessage id="investigation.shortcut.upload" defaultMessage="Cross-reference with other datasets" />
        </Button>
        <DialogToggleButton
          buttonProps={{
            text: intl.formatMessage(messages.share),
            icon: "key",
          }}
          Dialog={CollectionAccessDialog}
          dialogProps={{ collection }}
        />

      </ButtonGroup>
    )
  }
}

export default injectIntl(InvestigationQuickLinks);
