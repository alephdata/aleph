import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Helmet } from 'react-helmet';

import SearchStuff from './SearchStuff';
import SearchResult from './SearchResult';
import SearchFilter from './filter/SearchFilter';
import SearchFilterFacets from './facets/SearchFilterFacets';
import SectionLoading from 'src/components/common/SectionLoading';
import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';


class SearchScreen extends Component {
  render() {
    return (
      <SearchStuff>{searchStuff => (
        <Screen>
          {searchStuff.query.hasQuery() && (
            <Helmet>
              <title>{searchStuff.query.getQ()}</title>
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
              <SearchFilterFacets {...searchStuff}/>
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              <SearchFilter {...searchStuff} />
              <SearchResult {...searchStuff} />
              {searchStuff.isFetching && (
                <SectionLoading />
              )}
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      )}</SearchStuff>
    )
  }
}

export default SearchScreen;
