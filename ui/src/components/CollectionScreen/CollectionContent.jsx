import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchContext from 'src/components/search/SearchContext';
import SearchResult from 'src/components/search/SearchResult';
import SearchFilter from 'src/components/search/SearchFilter';

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
      <SearchContext context={context} aspects={aspects}>{searchContext => (
        <DualPane.ContentPane>
            <SearchFilter {...searchContext} />
            <SearchResult {...searchContext} />
        </DualPane.ContentPane>
      )}</SearchContext>
    );
  }
}

export default CollectionContent;
