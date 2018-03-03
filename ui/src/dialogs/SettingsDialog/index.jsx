import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import {addRole, fetchRole} from 'src/actions';


const messages = defineMessages({
  title: {
    id: 'settings.title',
    defaultMessage: 'Settings',
  }
});


class SettingsDialog extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { intl, app, session } = this.props;

    return (
      <Dialog
          icon="cog"
          isOpen={this.props.isOpen}
          onClose={this.props.toggleDialog}
          title={intl.formatMessage(messages.title)}>
        <div className="pt-dialog-body">
          Some content
        
        </div>
        <div className="pt-dialog-footer">
            <div className="pt-dialog-footer-actions">
                <Button
                    intent={Intent.PRIMARY}
                    onClick={this.props.toggleDialog}
                    text="Primary"
                />
            </div>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    app: state.metadata.app,
    session: state.session
  };
};

export default connect(mapStateToProps)(injectIntl(SettingsDialog));
