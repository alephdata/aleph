import React, { PureComponent } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchContext from 'src/components/SearchScreen/SearchContext';

class CollectionContent extends PureComponent {
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
