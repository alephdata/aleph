import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Button, AnchorButton, Intent, Tooltip, Position } from '@blueprintjs/core';

import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';
import { selectSession } from 'src/selectors';

const messages = defineMessages({
  login: {
    id: 'case.create.login',
    defaultMessage: 'You must sign in to upload your own data.',
  },
});


class CaseCreateButton extends React.Component {
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
          <AnchorButton icon="folder-new" intent={Intent.PRIMARY} disabled>
            <FormattedMessage id="cases.index.create" defaultMessage="New dataset" />
          </AnchorButton>
        </Tooltip>
      );
    }
    return (
      <>
        <Button onClick={this.toggle} icon="folder-new" intent={Intent.PRIMARY}>
          <FormattedMessage id="cases.index.create" defaultMessage="New dataset" />
        </Button>
        <CreateCaseDialog
          isOpen={this.state.isOpen}
          toggleDialog={this.toggle}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

CaseCreateButton = connect(mapStateToProps)(CaseCreateButton);
CaseCreateButton = injectIntl(CaseCreateButton);
export default CaseCreateButton;
