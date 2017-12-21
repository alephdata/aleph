import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchContext from 'src/components/SearchScreen/SearchContext';

class CollectionContent extends Component {
  render() {
    return (
      <DualPane.ContentPane>
        <SearchContext>
          banana
        </SearchContext>
      </DualPane.ContentPane>
    );
  }
}

export default CollectionContent;
