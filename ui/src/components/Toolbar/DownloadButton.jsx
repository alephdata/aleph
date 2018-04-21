import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core";


class DownloadButton extends React.Component {
  render() {
    const { document, isPreview } = this.props;
    const className = isPreview === true ? this.props.className : '';

    if (document.links !== undefined && document.links.file !== undefined) {
      return (
        <a href={document.links.file} download type="button" className={`DownloadButton pt-button ${className}`} style={this.props.style} rel="nofollow">
          <span className="pt-icon-standard pt-icon-download"/>
          <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
        </a>
      );
    } else {
      // Render disabled control
      return (
        <button type="button" className="DownloadButton pt-button" disabled style={this.props.style}>
          <span className="pt-icon-standard pt-icon-download"/>
          <span><FormattedMessage id="document.download" defaultMessage="Download"/></span>
        </button>
      );
    }
  }
}

export default DownloadButton;
