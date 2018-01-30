import React, { Component } from 'react';
import queryString from 'query-string';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';

import SearchContext from 'src/components/SearchScreen/SearchContext';
import getPath from 'src/util/getPath';

import './FolderViewer.css';

class FolderViewer extends Component {

  constructor(props) {
    super(props);
    this.state = {queryText: ''};

    this.onChangeQueryText = this.onChangeQueryText.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChangeQueryText({target}) {
    this.setState({queryText: target.value})
  }

  onSubmit(event) {
    const { history, document } = this.props;
    const path = getPath(document.links.ui) + '/related';
    history.push({
      pathname: path,
      search: queryString.stringify({
        q: this.state.queryText,
        'filter:ancestors': document.id
      })
    });
    event.preventDefault();
  }

  render() {
    const { intl, document } = this.props;
    const { queryText } = this.state;

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
      <div id="children" className="FolderViewer">
        <section className="folder-filter">
          <form onSubmit={this.onSubmit}>
            <div className="pt-input-group">
              <span className="pt-icon pt-icon-search"></span>
              <input className="pt-input" type="search"
                  placeholder={intl.formatMessage({id: "document.folder.search", defaultMessage: "Search this folder" })}
                  onChange={this.onChangeQueryText} value={queryText} />
            </div>
          </form>
          <div className="clearfix" />
        </section>
        <SearchContext collection={document.collection}
                       context={context}
                       aspects={aspects} />
      </div>
    );
  }
}

FolderViewer = injectIntl(FolderViewer)
FolderViewer = withRouter(FolderViewer)
export default FolderViewer;
