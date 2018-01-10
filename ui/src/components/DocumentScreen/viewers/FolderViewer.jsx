import React, { Component } from 'react';

import SearchContext from 'src/components/SearchScreen/SearchContext';


class FolderViewer extends Component {

  render() {
    const { document } = this.props;
    const context = {
      'filter:parent.id': document.id
    };
    const aspects = {
      filter: false,
      countries: false,
      collections: false
    };
    return (
      <div id="children">
        <SearchContext collection={document.collection}
                       context={context}
                       aspects={aspects} />
      </div>
    );
  }
}

export default FolderViewer;
