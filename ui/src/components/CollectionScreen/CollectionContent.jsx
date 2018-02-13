import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import SearchStuff from 'src/components/search/SearchStuff';
import SearchResult from 'src/components/search/SearchResult';
import SearchFilter from 'src/components/search/filter/SearchFilter';
import SectionLoading from 'src/components/common/SectionLoading';

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
      <SearchStuff context={context} aspects={aspects}>{searchStuff => (
        <DualPane.ContentPane>
            <SearchFilter {...searchStuff} />
            <SearchResult {...searchStuff} />
            {searchStuff.isFetching && (
              <SectionLoading />
            )}
        </DualPane.ContentPane>
      )}</SearchStuff>
    );
  }
}

export default CollectionContent;
