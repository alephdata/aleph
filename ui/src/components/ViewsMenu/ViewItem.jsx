import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl } from 'react-intl';
import c from 'classnames';
import { Tooltip, Position } from '@blueprintjs/core';
import { Link } from 'react-router-dom';

class ViewItem extends React.Component {
  constructor(props) {
    super(props);
  }

  onClick(event, mode) {
    this.props.onClick(event, mode)
  }

  render() {
    const {message, mode, icon, href, isPreview = false, isActive, key} = this.props;
    const className = c('ModeButtons', 'pt-button pt-large', {'pt-active': isActive});
    return (
        <Tooltip key={mode} content={message} position={Position.BOTTOM_RIGHT}>
          <React.Fragment>
            {!isPreview && (
              <Link to={href} className={className}>
                <i className={c('fa', 'fa-fw', icon)} />
              </Link>
            )}
            {isPreview && (
              <a onClick={(e) => this.onClick(e, mode)} className={className}>
                <i className={c('fa', 'fa-fw', icon)} />
              </a>
            )}
          </React.Fragment>
        </Tooltip>
    );
  }
}

ViewItem = injectIntl(ViewItem);
ViewItem = withRouter(ViewItem);
export default ViewItem;