import React, { Component } from 'react';
import { withRouter } from 'react-router';

import SearchContext from 'src/components/search/SearchContext';
import SearchResult from 'src/components/search/SearchResult';
import Toolbar from 'src/components/common/Toolbar/DocumentToolbar';

import './FolderViewer.css';

class FolderViewer extends Component {
  render() {
    const { document } = this.props;

    if (!document || !document.id || !document.links) {
      return null;
    }
    const context = {
      'filter:parent.id': document.id
    };
    const aspects = {
      filter: false,
      countries: false,
      collections: false
    };
    return (
      <React.Fragment>
        <Toolbar document={document}/>
        <div id="children" className="FolderViewer">
          <SearchContext context={context} aspects={aspects}>{searchContext => (
            <div>
              <SearchResult {...searchContext} />
            </div>
          )}</SearchContext>
        </div>
      </React.Fragment>
    );
  }
}

FolderViewer = withRouter(FolderViewer)
export default FolderViewer;
