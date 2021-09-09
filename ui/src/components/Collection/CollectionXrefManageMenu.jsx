import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { ButtonGroup, Classes } from '@blueprintjs/core';
import c from 'classnames';

import { DialogToggleButton } from 'components/Toolbar';
import CollectionXrefDialog from 'dialogs/CollectionXrefDialog/CollectionXrefDialog';
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
});

class CollectionXrefManageMenu extends Component {
  render() {
    const { collection, intl, result, session } = this.props;
    if (!session.loggedIn) {
      return null;
    }

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
        </ButtonGroup>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  session: selectSession(state),
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(CollectionXrefManageMenu);
