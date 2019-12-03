import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Button, AnchorButton, Intent, Tooltip, Position } from '@blueprintjs/core';

import CreateDiagramDialog from 'src/dialogs/CreateDiagramDialog/CreateDiagramDialog';
import { selectSession } from 'src/selectors';

const messages = defineMessages({
  login: {
    id: 'diagram.create.login',
    defaultMessage: 'You must sign in to create a network diagram.',
  },
});


class DiagramCreateButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  }

  render() {
    const { intl, session } = this.props;
    if (!session.loggedIn) {
      return (
        <Tooltip
          content={intl.formatMessage(messages.login)}
          position={Position.BOTTOM}
        >
          <AnchorButton icon="send-to-graph" intent={Intent.PRIMARY} disabled>
            <FormattedMessage id="diagrams.index.create" defaultMessage="New diagram" />
          </AnchorButton>
        </Tooltip>
      );
    }
    return (
      <>
        <Button onClick={this.toggle} icon="send-to-graph" intent={Intent.PRIMARY}>
          <FormattedMessage id="diagrams.index.create" defaultMessage="New diagram" />
        </Button>
        <CreateDiagramDialog
          isOpen={this.state.isOpen}
          toggleDialog={this.toggle}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

DiagramCreateButton = connect(mapStateToProps)(DiagramCreateButton);
DiagramCreateButton = injectIntl(DiagramCreateButton);
export default DiagramCreateButton;
