import React, { Component } from 'react';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import HomeInfo from 'src/components/HomeScreen/HomeInfo';
import SearchContext from './SearchContext';


class SearchScreen extends Component {
  render() {
    return (
      <Screen>
        <Breadcrumbs />
        <DualPane>
          <HomeInfo {...this.props} />
          <DualPane.ContentPane>
            <SearchContext />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}

export default SearchScreen;
