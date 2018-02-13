import React from 'react';
import { FormattedMessage } from 'react-intl';

import './DocumentToolbar.css';

export default class extends React.Component {
  render() {
    return (
      <div className="document-content-toolbar">
        <button type="button" className="pt-button" disabled>
          <span className="pt-icon-standard pt-icon-download"></span>
          <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
        </button>
        <div className="pt-input-group" style={{maxWidth: 200, float: 'right'}}>
          <span className="pt-icon pt-icon-search"></span>
          <input className="pt-input" disabled type="search" placeholder="Search in document" dir="auto"/>
        </div>
      </div>
    );
  }
}