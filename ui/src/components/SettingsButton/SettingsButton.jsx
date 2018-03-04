import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Button } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import SettingsDialog from 'src/dialogs/SettingsDialog';
import AlertsDialog from 'src/dialogs/AlertsDialog';

class SettingsButton extends Component {
  constructor() {
    super();
    this.state = {
      settingsIsOpen: false,
      alertsIsOpen: false,
    }
    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAlerts = this.toggleAlerts.bind(this);
  }

  toggleSettings() {
    this.setState({
      settingsIsOpen: !this.state.settingsIsOpen
    })
  }

  toggleAlerts() {
    this.setState({
      alertsIsOpen: !this.state.alertsIsOpen
    })
  }

  render() {
    const { session } = this.props;
    if (!session.loggedIn) {
      return null;
    }

    return (
      <React.Fragment>
        <Button icon="notifications" className="pt-minimal"  onClick={this.toggleAlerts}>
          <FormattedMessage id="nav.notifications" defaultMessage="Notifications"/>
        </Button>
        <AlertsDialog isOpen={this.state.alertsIsOpen}
                      toggleDialog={this.toggleAlerts} />
        <Button icon="cog" className="pt-minimal"  onClick={this.toggleSettings}>
          <FormattedMessage id="nav.settings" defaultMessage="Settings"/>
        </Button>
        <SettingsDialog isOpen={this.state.settingsIsOpen}
                        toggleDialog={this.toggleSettings} />
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { session: state.session };
};

SettingsButton = connect(mapStateToProps)(SettingsButton);
export default SettingsButton;
