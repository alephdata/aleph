import React from 'react';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

import SearchContext from './SearchContext';
import SearchResult from './SearchResult';
import SearchFacets from './SearchFacets';
//import SearchFilter from './SearchFilter';

import './SearchScreen.css';

class SearchScreen extends React.Component {
  render() {
    return (
      <SearchContext>{searchContext => (
        <Screen searchContext={searchContext} title={searchContext.query..getString('q')}>
          <DualPane className="SearchScreen">
            <DualPane.InfoPane className="SearchFacetsPane">
              <SearchFacets {...searchContext}/>
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              {/*<SearchFilter {...searchContext} />*/}
              <SearchResult {...searchContext} />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      )}</SearchContext>
    )
  }
}

export default SearchScreen;
