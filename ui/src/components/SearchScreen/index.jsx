import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import SearchContext from './SearchContext';


class SearchScreen extends Component {
  render() {
    return (
      <Screen>
        <Breadcrumbs>
          <li>
            <FormattedMessage id="search.breadcrumb" defaultMessage="Global search" />
          </li>
        </Breadcrumbs>
        <DualPane>
          <DualPane.ContentPane>
            <SearchContext />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    )
  }
}

export default SearchScreen;
