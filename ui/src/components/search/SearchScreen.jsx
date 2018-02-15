import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Helmet } from 'react-helmet';

import SearchContext from './SearchContext';
import SearchResult from './SearchResult';
import SearchFilter from './filter/SearchFilter';
import SearchFilterFacets from './facets/SearchFilterFacets';
import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';


class SearchScreen extends Component {
  render() {
    return (
      <SearchContext>{searchContext => (
        <Screen>
          {searchContext.query.hasQuery() && (
            <Helmet>
              <title>{searchContext.query.getQ()}</title>
            </Helmet>
          )}
          <Breadcrumbs>
            <li>
              <a className="pt-breadcrumb">
                <FormattedMessage id="search.breadcrumb" defaultMessage="Global search" />
              </a>
            </li>
          </Breadcrumbs>
          <DualPane>
            <DualPane.InfoPane>
              <SearchFilterFacets {...searchContext}/>
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              <SearchFilter {...searchContext} />
              <SearchResult {...searchContext} />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      )}</SearchContext>
    )
  }
}

export default SearchScreen;
