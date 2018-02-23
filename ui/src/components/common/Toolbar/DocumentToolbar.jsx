import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';

import getPath from 'src/util/getPath';

import DownloadButton from './DownloadButton'
import PagingButtons from './PagingButtons'

import './DocumentToolbar.css';

const messages = defineMessages({
  placeholder_file_search: {
    id: 'document.placeholder_file_search',
    defaultMessage: 'Search document',
  },
  placeholder_folder_search: {
    id: 'document.placeholder_folder_search',
    defaultMessage: 'Search folder',
  },
});

class DocumentToolbar extends React.Component {
  constructor(props) {
    super(props);
    
    let searchPlaceholder = this.props.intl.formatMessage(messages.placeholder_file_search);
    let searchEnabled = false;
    
    // If is a folder (but NOT an email!)
    if (this.props.document && this.props.document.children !== undefined && this.props.document.children > 0 && this.props.document.schema !== 'Email') {
      searchPlaceholder = this.props.intl.formatMessage(messages.placeholder_folder_search);
      // @FIXME Search disabled old search now broken and needs to be refactored
      //searchEnabled = true
    }

    this.state = {
      queryText: '',
      searchPlaceholder: searchPlaceholder,
      searchEnabled: searchEnabled
    };

    this.onChangeSearchQuery = this.onChangeSearchQuery.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  onChangeSearchQuery({target}) {
    this.setState({queryText: target.value});
  }

  /*
   * @TODO Perform context sensitive search depending on the type of document
   * (currently only does a folder search)
   */
  onSubmitSearch(event) {
    const path = getPath(this.props.document.links.ui) + '/related';
    this.props.history.push({
      pathname: path,
      search: queryString.stringify({
        q: this.state.queryText,
        'filter:ancestors': this.props.document.id
      })
    });
    event.preventDefault();
  }
    
  render() {
    let downloadLink
    // @TODO If email w/ attachments then pass them as array of download options
    if (this.props.document && this.props.document.links && this.props.document.links.file) {
      downloadLink = { name: '', url: this.props.document.links.file }
    }

    return (
      <div className="DocumentToolbar">
        <PagingButtons pageNumber={this.props.pageNumber} pageTotal={this.props.pageTotal}/>
        <form onSubmit={this.onSubmitSearch} className="ToolbarSearchForm">
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-search"></span>
            <input className="pt-input" type="search" disabled={!this.state.searchEnabled} placeholder={this.state.searchPlaceholder} onChange={this.onChangeSearchQuery} value={this.state.queryText} dir="auto"/>
          </div>
        </form>
        <DownloadButton downloadLink={downloadLink} session={this.props.session}/>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  session: state.session,
});

DocumentToolbar = injectIntl(DocumentToolbar)
DocumentToolbar = withRouter(DocumentToolbar)

export default connect(mapStateToProps)(DocumentToolbar);