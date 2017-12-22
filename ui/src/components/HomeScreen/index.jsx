import React, { Component } from 'react';
import { connect } from 'react-redux';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import HomeInfo from './HomeInfo';
import HomeContent from './HomeContent';

class HomeScreen extends Component {
  render() {
    return (
      <Screen>
        <Breadcrumbs />
        <DualPane>
          <HomeInfo {...this.props} />
          <HomeContent {...this.props} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = state => {
  return {
    collections: state.collections,
  };
};

export default connect(mapStateToProps)(HomeScreen);
