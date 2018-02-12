import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchContext from 'src/components/search/SearchContext';

class CollectionContent extends Component {
  render() {
    const { collection } = this.props;
    const context = {
      'filter:collection_id': collection.id
    };
    const aspects = {
      collections: false,
      countries: true
    };
    return (
      <DualPane.ContentPane>
        <SearchContext collection={collection}
                       context={context}
                       aspects={aspects} />
      </DualPane.ContentPane>
    );
  }
}

export default CollectionContent;
