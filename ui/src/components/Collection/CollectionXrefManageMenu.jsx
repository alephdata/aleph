import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { AnchorButton, Button, ButtonGroup } from '@blueprintjs/core';

import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import { selectSession } from 'src/selectors';


class CollectionXrefManageMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      xrefIsOpen: false,
    };
    this.toggleXref = this.toggleXref.bind(this);
  }

  toggleXref = () => this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));

  render() {
    const { collection, session } = this.props;

    if (!session.loggedIn) {
      return null;
    }

    /* eslint-disable camelcase */
    const downloadLink = collection.links?.xref_export;
    // const downloadDisabled = !result.total
    const downloadDisabled = false;

    return (
      <>
        <ButtonGroup>
          <Button icon="play" disabled={!collection.writeable} onClick={this.toggleXrefDialog}>
            <FormattedMessage
              id="xref.compute"
              defaultMessage="Compute"
            />
          </Button>
          <AnchorButton icon="download" href={downloadLink} download disabled={downloadDisabled}>
            <FormattedMessage
              id="xref.download"
              defaultMessage="Download Excel"
            />
          </AnchorButton>
        </ButtonGroup>
        <CollectionXrefDialog
          collection={collection}
          isOpen={this.state.xrefIsOpen}
          toggleDialog={this.toggleXrefDialog}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(CollectionXrefManageMenu);
