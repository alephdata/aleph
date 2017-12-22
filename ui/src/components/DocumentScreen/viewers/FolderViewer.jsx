import React, { Component } from 'react';

import SearchContext from 'src/components/SearchScreen/SearchContext';


class FolderViewer extends Component {

  render() {
    const { document } = this.props;
    return (
      <SearchContext collection={document.collection} parent={document} />
    );
  }
}

export default FolderViewer;
