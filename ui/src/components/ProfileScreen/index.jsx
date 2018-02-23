import React, {Component} from 'react';
import {connect} from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';
import {injectIntl} from "react-intl";

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import AlertsPane from './AlertsPane';
import ProfileInfo from './ProfileInfo';

class ProfileScreen extends Component {

  render() {
    const { intl, app, session } = this.props;

    if(!session.loggedIn) {
      return <NonIdealState
        visual="error"
        title={intl.formatMessage({id: 'profile.settings.error', defaultMessage: "You cannot access profile settings."})}/>
    }

    return (
      <Screen>
        <Breadcrumbs collection={{label: 'Settings', links: {ui: app.ui_uri + 'settings'}}} />
        <DualPane>
          <ProfileInfo/>
          <AlertsPane/>
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    app: state.metadata.app,
    session: state.session
  };
};

export default connect(mapStateToProps)(injectIntl(ProfileScreen));
