import React, { Component } from 'react';

import SearchContext from 'src/components/SearchScreen/SearchContext';


class FolderViewer extends Component {

  render() {
    const { document } = this.props;
    const context = {
      'filter:parent.id': document.id
    };
    return (
      <SearchContext collection={document.collection} context={context} />
    );
  }
}

export default FolderViewer;
