import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core";
import queryString from 'query-string';
import getPath from 'src/util/getPath';

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
      <div className="document-content-toolbar">
        <DownloadButton downloadLink={downloadLink} session={this.props.session}/>
        <form onSubmit={this.onSubmitSearch} style={{maxWidth: 200, float: 'right'}}>
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-search"></span>
            <input className="pt-input" type="search" disabled={!this.state.searchEnabled} placeholder={this.state.searchPlaceholder} onChange={this.onChangeSearchQuery} value={this.state.queryText} dir="auto"/>
          </div>
        </form>
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

/*
 * Expects a 'download' prop with the values {name: '', url: ''}
 * 
 * May also be passed an array of similar objects if there are multiple download
 * options, the first item in the array will be the default download action.
 */
export class DownloadButton extends React.Component {
  render() {
    if (this.props.session && this.props.downloadLink) {
      if (Array.isArray(this.props.downloadLink)) {
        // If passed an array, rrender Download button with multiple options
        let popoverContent = (
            <ul className="pt-menu">
              {this.props.downloadLink.map((item,i) => {
                return <li key={i}><a className="pt-menu-item" href={item.url}>{item.name}</a></li>
              })}
            </ul>
          )
        return (
          <div className="pt-button-group">
            <a href={this.props.session.token ? `${this.props.downloadLink[0].url}?api_key=${this.props.session.token}` : this.props.downloadLink[0].url} className="pt-button">
              <span className="pt-icon-standard pt-icon-download"></span>
              <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
            </a>
           <Popover
            content={popoverContent}
            interactionKind={PopoverInteractionKind.CLICK}
            position={Position.BOTTOM_RIGHT}
            modifiers={{
              arrow: { enabled: false },
              preventOverflow: { enabled: false, boundariesElement: "scrollParent" }
            }}
            >
              <div className="pt-button pt-icon-caret-down"/>
            </Popover>
          </div>
        );
      } else {
        // Render Download button with single button
        return (
          <a href={this.props.session.token ? `${this.props.downloadLink.url}?api_key=${this.props.session.token}` : this.props.downloadLink.url} type="button" className="pt-button">
            <span className="pt-icon-standard pt-icon-download"></span>
            <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
          </a>
        );
      }
    } else {
      // Render disabled control
      return (
        <button type="button" className="pt-button" disabled>
          <span className="pt-icon-standard pt-icon-download"></span>
          <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
        </button>
      );
    }
  }
}