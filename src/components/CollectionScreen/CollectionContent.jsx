import React, { Component } from 'react';
import { withRouter } from 'react-router';

import DualPane from 'components/common/DualPane';
import SearchScreen_ from 'components/SearchScreen';
const SearchScreen = withRouter(SearchScreen_);

class CollectionContent extends Component {
  render() {
    return (
      <DualPane.ContentPane>
        <SearchScreen />
      </DualPane.ContentPane>
    );
  }
}

export default CollectionContent;
