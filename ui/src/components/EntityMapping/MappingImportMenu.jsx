import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent, Position, Tooltip } from '@blueprintjs/core';
import { selectSession } from 'src/selectors';

import MappingImportDialog from 'src/dialogs/MappingImportDialog/MappingImportDialog';

const messages = defineMessages({
  login: {
    id: 'diagram.create.login',
    defaultMessage: 'You must log in to create a diagram',
  },
});

class MappingImportMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      importEnabled: false,
    };
    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog = (importEnabled) => this.setState(({ isOpen }) => (
    { isOpen: !isOpen, importEnabled }
  ));

  render() {
    const { collection, intl, session } = this.props;
    const {
      isOpen, importEnabled,
    } = this.state;
    const canAdd = session?.loggedIn;

    const buttonContent = (
      <ButtonGroup>
        <Button onClick={() => this.toggleDialog(false)} icon="send-to-graph" intent={Intent.PRIMARY} disabled={!canAdd}>
          <FormattedMessage id="diagrams.index.create" defaultMessage="New diagram" />
        </Button>
        <Button onClick={() => this.toggleDialog(true)} icon="import" disabled={!canAdd}>
          <FormattedMessage id="diagrams.index.import" defaultMessage="Import diagram" />
        </Button>
      </ButtonGroup>
    );

    return (
      <>
        {canAdd && buttonContent}
        {!canAdd && (
          <Tooltip
            content={intl.formatMessage(messages.login)}
            position={Position.BOTTOM}
          >
            {buttonContent}
          </Tooltip>
        )}
        <MappingImportDialog
          importEnabled={importEnabled}
          isOpen={isOpen}
          toggleDialog={this.toggleDialog}
          diagram={{ collection }}
          canChangeCollection={!collection}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(MappingImportMenu);
