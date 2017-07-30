import React, { Component } from 'react';

import DocumentListItem from './DocumentListItem';
import EntityListItem from './EntityListItem';

class SearchResultListItem extends Component {
  render() {
    var result = this.props.result;
    if (result.schema === 'Document') {
      return (<DocumentListItem {...result} />);
    } else {
      return (<EntityListItem {...result} />);
    }
  }
}

export default SearchResultListItem;
