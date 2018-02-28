import React, { Component } from 'react';
import { Helmet } from 'react-helmet';

import Screen from 'src/components/common/Screen';
import DualPane from 'src/components/common/DualPane';

import SearchResult from './SearchResult';
import SearchFacets from './SearchFacets';
//import SearchFilter from './SearchFilter';

import './SearchScreen.css';

class SearchScreen extends Component {
  render() {
    const { searchContext } = this.props;
    return (
      <Screen>
        {searchContext && searchContext.query.hasQuery() && (
          <Helmet>
            <title>{searchContext.query.getQ()}</title>
          </Helmet>
        )}
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
    )
  }
}

export default SearchScreen;
