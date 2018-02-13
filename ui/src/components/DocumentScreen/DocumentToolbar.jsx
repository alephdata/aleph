import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core";

import './DocumentToolbar.css';

class DocumentToolbar extends React.Component {
  render() {
    return (
      <div className="document-content-toolbar">
        <DownloadButton download={this.props.download} session={this.props.session}/>
        <div className="pt-input-group" style={{maxWidth: 200, float: 'right'}}>
          <span className="pt-icon pt-icon-search"></span>
          <input className="pt-input" disabled type="search" placeholder="Search in document" dir="auto"/>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  session: state.session,
});

export default connect(mapStateToProps)(DocumentToolbar);

/*
 * Expects a 'download' prop with the values {name: '', url: ''}
 * 
 * May also be passed an array of similar objects if there are multiple download
 * options, the first item in the array will be the default download action.
 */
export class DownloadButton extends React.Component {
  render() {
      
    if (this.props.session && this.props.download) {
      if (Array.isArray(this.props.download)) {
        // If passed an array, rrender Download button with multiple options
        let popoverContent = (
            <ul className="pt-menu">
              {this.props.download.map((item,i) => {
                return <li key={i}><a className="pt-menu-item" href={item.url}>{item.name}</a></li>
              })}
            </ul>
          )
        return (
          <div className="pt-button-group">
            <a href={this.props.session.token ? `${this.props.download[0].url}?api_key=${this.props.session.token}` : this.props.download[0].url} className="pt-button">
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
              <a type="button" className="pt-button pt-icon-caret-down"></a>
            </Popover>
          </div>
        );
      } else {
        // Render Download button with single button
        return (
          <a href={this.props.session.token ? `${this.props.download.url}?api_key=${this.props.session.token}` : this.props.download.url} type="button" className="pt-button">
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