import React, { Component } from 'react';
import { connect } from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import HomeInfo from './HomeInfo';
import HomeContent from './HomeContent';

class HomeScreen extends Component {
  render() {
    return (
      <DualPane>
        <HomeInfo {...this.props} />
        <HomeContent {...this.props} />
      </DualPane>
    );
  }
}

const mapStateToProps = state => {
  return {
    collections: state.collections,
  };
};

export default connect(mapStateToProps)(HomeScreen);
