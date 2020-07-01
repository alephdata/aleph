import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent, Position, Tooltip } from '@blueprintjs/core';
import { selectSession } from 'src/selectors';

import EntitySetCreateDialog from 'src/dialogs/EntitySetCreateDialog/EntitySetCreateDialog';

const messages = defineMessages({
  login: {
    id: 'entityset.create.login',
    defaultMessage: 'You must log in to create a entityset',
  },
});

class EntitySetCreateMenu extends Component {
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
    const { type = 'generic', collection, intl, session } = this.props;
    const {
      isOpen, importEnabled,
    } = this.state;
    const canAdd = session?.loggedIn;
    const canImportVisDiagram = canAdd && type === 'diagram';

    const buttonContent = (
      <ButtonGroup>
        <Button onClick={() => this.toggleDialog(false)} icon="send-to-graph" intent={Intent.PRIMARY} disabled={!canAdd}>
          <FormattedMessage id="entitysets.index.create" defaultMessage="New {type}" values={{ type }} />
        </Button>
        <Button onClick={() => this.toggleDialog(true)} icon="import" disabled={!canImportVisDiagram}>
          <FormattedMessage id="entitysets.index.import" defaultMessage="Import {type}" values={{ type }} />
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
        <EntitySetCreateDialog
          importEnabled={importEnabled}
          isOpen={isOpen}
          toggleDialog={this.toggleDialog}
          entitySet={{ collection }}
          type={ type }
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
)(EntitySetCreateMenu);
