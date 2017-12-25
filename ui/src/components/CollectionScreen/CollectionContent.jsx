import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchContext from 'src/components/SearchScreen/SearchContext';

class CollectionContent extends Component {
  render() {
    const { collection } = this.props;
    const context = {
      'filter:collection_id': collection.id
    };
    return (
      <DualPane.ContentPane>
        <SearchContext collection={collection} context={context} />
      </DualPane.ContentPane>
    );
  }
}

export default CollectionContent;
