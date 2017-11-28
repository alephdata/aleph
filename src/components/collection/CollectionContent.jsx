import React, { Component } from 'react';
import { withRouter } from 'react-router';

import Article from 'components/Article';
import SearchScreen_ from 'screens/SearchScreen';
const SearchScreen = withRouter(SearchScreen_);

class CollectionContent extends Component {
  render() {
    return (
      <Article.ContentPane>
        <SearchScreen />
      </Article.ContentPane>
    );
  }
}

export default CollectionContent;
