import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchContext from 'src/components/SearchScreen/SearchContext';

class CollectionContent extends Component {
  render() {
    const { collection } = this.props;
    return (
      <DualPane.ContentPane>
        <SearchContext collection={collection} />
      </DualPane.ContentPane>
    );
  }
}

export default CollectionContent;
