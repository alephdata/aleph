import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup, Button, AnchorButton } from "@blueprintjs/core";

import getPath from 'src/util/getPath';

import DownloadButton from './DownloadButton'

import './DocumentToolbar.css';

class DocumentToolbar extends React.Component {
  constructor(props) {
    super(props);
    
    let searchPlaceholder = this.props.intl.formatMessage({id: "document.file.search", defaultMessage: "Search document" });
    let searchEnabled = false;
    
    if (this.props.document.children !== undefined && this.props.document.children > 0) {
      searchPlaceholder = this.props.intl.formatMessage({id: "document.folder.search", defaultMessage: "Search folder" })
      searchEnabled = true
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
    if (this.props.document.links && this.props.document.links.file) {
      downloadLink = { name: '', url: this.props.document.links.file }
    }

    return (
      <div className="DocumentToolbar">
        { this.props.pageNumber && this.props.pageTotal && (
          <ButtonGroup minimal={true} style={{float: 'left'}}>
              <AnchorButton href={`#page=${this.props.pageNumber-1}`} icon="arrow-left" disabled={this.props.pageNumber <= 1}/>
              <Button disabled style={{minWidth: '70px'}}>{this.props.pageNumber} of {this.props.pageTotal}</Button>
              <AnchorButton href={`#page=${this.props.pageNumber+1}`} icon="arrow-right" disabled={this.props.pageNumber >= this.props.pageTotal}/>
          </ButtonGroup>
        )}
        <form onSubmit={this.onSubmitSearch} style={{maxWidth: 200, float: 'right', margin: '0px 10px'}}>
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-search"></span>
            <input className="pt-input" type="search" disabled={!this.state.searchEnabled} placeholder={this.state.searchPlaceholder} onChange={this.onChangeSearchQuery} value={this.state.queryText} dir="auto"/>
          </div>
        </form>
        <DownloadButton style={{float: 'right', margin: 0}} downloadLink={downloadLink} session={this.props.session}/>
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