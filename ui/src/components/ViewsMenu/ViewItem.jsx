import React from 'react';
import { withRouter } from 'react-router';
import { connect } from "react-redux";
import { injectIntl, defineMessages } from 'react-intl';
import c from 'classnames';
import { Tooltip, Position } from '@blueprintjs/core';

import './ViewsItem.css';


class ViewItem extends React.Component {
  render() {
    const {message, mode, iconName, href, isPreview = false} = this.props;
    return (
      <div className='ViewsMenu'>
        <Tooltip content={intl.formatMessage(messages.xref)} position={Position.BOTTOM_RIGHT}>
          <a href={`/collections/${collection.id}/xref`}
             className={c('ModeButtons', 'pt-button pt-large')}>
            <i className="fa fa-fw fal fa-folder-open"/>
          </a>
        </Tooltip>
      </div>
    );
  }
}

ViewItem = injectIntl(ViewItem);
ViewItem = withRouter(ViewItem);
export default ViewItem;