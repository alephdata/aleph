import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { AnchorButton, Button, ButtonGroup, Classes } from '@blueprintjs/core';
import c from 'classnames';

import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import { selectSession } from 'src/selectors';

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
  constructor(props) {
    super(props);
    this.state = {
      xrefIsOpen: false,
    };
    this.toggleXref = this.toggleXref.bind(this);
  }

  toggleXref = () => this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));

  render() {
    const { collection, intl, result, session } = this.props;

    if (!session.loggedIn) {
      return null;
    }

    /* eslint-disable camelcase */
    const downloadLink = collection.links?.xref_export;
    const showDownload = !result.isPending && downloadLink && result.total > 0;
    const xrefButtonText = result.total > 0
      ? intl.formatMessage(messages.recompute)
      : intl.formatMessage(messages.compute);

    return (
      <>
        <ButtonGroup className="CollectionXrefManageMenu">
          <Button
            icon="play"
            disabled={!collection.writeable}
            onClick={this.toggleXref}
            className={c({ [Classes.SKELETON]: result.isPending })}
          >
            {xrefButtonText}
          </Button>
          {showDownload && (
            <AnchorButton icon="download" href={downloadLink} download>
              <FormattedMessage
                id="xref.download"
                defaultMessage="Download Excel"
              />
            </AnchorButton>
          )}
        </ButtonGroup>
        <CollectionXrefDialog
          collection={collection}
          isOpen={this.state.xrefIsOpen}
          toggleDialog={this.toggleXref}
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
