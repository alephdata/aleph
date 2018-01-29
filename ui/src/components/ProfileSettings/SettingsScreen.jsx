import React, {Component} from 'react';
import {connect} from 'react-redux';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import AlertsScreen from './AlertsScreen';
import ProfileInfo from './ProfileInfo';

class SettingsScreen extends Component {

  render() {
    const { app } = this.props;
    return (
      <Screen>
        <Breadcrumbs collection={{label: 'User Settings', links: {ui: app.ui_uri + 'settings'}}} />
        <DualPane>
          <ProfileInfo/>
          <AlertsScreen/>
        </DualPane>
      </Screen>

    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    app: state.metadata.app
  };
};

export default connect(mapStateToProps)(SettingsScreen);
