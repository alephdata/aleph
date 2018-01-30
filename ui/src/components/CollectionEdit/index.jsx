import React, {Component} from 'react';
import {connect} from 'react-redux';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionEditContent from './CollectionEditContent';
import CollectionEditInfo from './CollectionEditInfo';

class CollectionEditScreen extends Component {

  render() {
    const { app } = this.props;
    return (
      <Screen>
        <Breadcrumbs collection={{label: 'Collection Settings', links: {ui: app.ui_uri + 'edit'}}} />
        <DualPane>
          <CollectionEditInfo/>
          <CollectionEditContent/>
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

export default connect(mapStateToProps)(CollectionEditScreen);
