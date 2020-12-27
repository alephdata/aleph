import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { ButtonGroup, Classes } from '@blueprintjs/core';
import c from 'classnames';

import { DialogToggleButton } from 'components/Toolbar';
import ExportDialog from 'dialogs/ExportDialog/ExportDialog';
import CollectionXrefDialog from 'dialogs/CollectionXrefDialog/CollectionXrefDialog';
import { triggerCollectionXrefDownload } from 'actions';
import { selectSession } from 'selectors';


const messages = defineMessages({
  compute: {
    id: 'xref.compute',
    defaultMessage: 'Compute',
  },
  recompute: {
    id: 'xref.recompute',
    defaultMessage: 'Re-compute',
  },
  export: {
    id: 'xref.download',
    defaultMessage: 'Export results',
  }
});

class CollectionXrefManageMenu extends Component {
  render() {
    const { collection, intl, result, session } = this.props;
    if (!session.loggedIn) {
      return null;
    }

    /* eslint-disable camelcase */
    const downloadLink = collection?.links?.xref_export;
    const showDownload = !(result.total === undefined) && downloadLink && result.total > 0;
    const xrefButtonText = result.total > 0
      ? intl.formatMessage(messages.recompute)
      : intl.formatMessage(messages.compute);

    return (
      <>
        <ButtonGroup className="CollectionXrefManageMenu">
          <DialogToggleButton
            buttonProps={{
              text: xrefButtonText,
              icon: "play",
              disabled: !collection.writeable,
              className: c({ [Classes.SKELETON]: result.total === undefined })
            }}
            Dialog={CollectionXrefDialog}
            dialogProps={{ collection }}
          />
          {showDownload && (
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.export),
                icon: "export",
                className: "bp3-intent-primary"
              }}
              Dialog={ExportDialog}
              dialogProps={{
                onExport: () => this.props.triggerCollectionXrefDownload(collection.id)
              }}
            />
          )}
        </ButtonGroup>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  session: selectSession(state),
});

export default compose(
  connect(mapStateToProps, { triggerCollectionXrefDownload }),
  injectIntl,
)(CollectionXrefManageMenu);
