import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Popover, PopoverInteractionKind, Position } from "@blueprintjs/core";

import getPath from 'src/util/getPath';


class ParentButton extends React.Component {
  render() {
    const { document, isPreview } = this.props;
    const className = isPreview === true ? this.props.className : '';

    if (document.parent === undefined || isPreview) {
      return null;
    }

    return (
      <a href={getPath(document.parent.links.ui)} className={`ParentButton pt-button ${className}`}>
        <span className="pt-icon-standard pt-icon-folder-open"/>
        <span>
          <FormattedMessage id="document.parent.nav" defaultMessage="Up"/>
        </span>
      </a>
    );
  }
}

export default ParentButton;