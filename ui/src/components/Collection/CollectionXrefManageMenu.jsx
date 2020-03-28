import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { AnchorButton, Button, ButtonGroup, Classes, Intent } from '@blueprintjs/core';
import c from 'classnames';

import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import XrefContextDialog from 'src/dialogs/XrefContextDialog/XrefContextDialog';
import { selectSession, selectRole } from 'src/selectors';


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
      contextIsOpen: false,
    };
    this.toggleXref = this.toggleXref.bind(this);
    this.toggleContext = this.toggleContext.bind(this);
  }

  toggleXref = () => this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));

  toggleContext = () => this.setState(({ contextIsOpen }) => ({ contextIsOpen: !contextIsOpen }));

  render() {
    const { collection, intl, result, session, contextId, context } = this.props;
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
          {!contextId && (
            <Button
              icon="flow-review"
              onClick={this.toggleContext}
              className={c({ [Classes.SKELETON]: result.isPending })}
            >
              <FormattedMessage
                id="xref.context.select"
                defaultMessage="Review matches..."
              />
            </Button>
          )}
          {contextId && (
            <Button
              icon="flow-review"
              intent={Intent.DANGER}
              onClick={(e) => this.props.updateContext(undefined)}
              className={c({ [Classes.SKELETON]: result.isPending })}
            >
              <FormattedMessage
                id="xref.context.stop"
                defaultMessage="Stop review: {context}"
                values={{
                  context: context.label
                }}
              />
            </Button>
          )}
        </ButtonGroup>
        <CollectionXrefDialog
          collection={collection}
          isOpen={this.state.xrefIsOpen}
          toggleDialog={this.toggleXref}
        />
        <XrefContextDialog
          isOpen={this.state.contextIsOpen}
          toggleDialog={this.toggleContext}
          contextId={contextId}
          updateContext={this.props.updateContext}
        />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  session: selectSession(state),
  context: selectRole(state, ownProps.contextId)
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(CollectionXrefManageMenu);
