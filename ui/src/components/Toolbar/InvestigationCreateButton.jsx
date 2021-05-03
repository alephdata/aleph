import React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, Intent, Position } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import CreateInvestigationDialog from 'dialogs/CreateInvestigationDialog/CreateInvestigationDialog';
import { selectSession } from 'selectors';

const messages = defineMessages({
  login: {
    id: 'case.create.login',
    defaultMessage: 'You must sign in to upload your own data.',
  },
});

class InvestigationCreateButton extends React.Component {
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
    const { icon, intl, session, text } = this.props;
    const buttonDisabled = !session.loggedIn;

    return (
      <>
        <Tooltip
          content={intl.formatMessage(messages.login)}
          disabled={!buttonDisabled}
        >
          <Button
            onClick={this.toggle}
            icon={icon}
            text={text}
            intent={Intent.PRIMARY}
            disabled={buttonDisabled}
          />
        </Tooltip>
        <CreateInvestigationDialog
          isOpen={this.state.isOpen}
          toggleDialog={this.toggle}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

InvestigationCreateButton = connect(mapStateToProps)(InvestigationCreateButton);
InvestigationCreateButton = injectIntl(InvestigationCreateButton);
export default InvestigationCreateButton;
