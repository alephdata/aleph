import React from 'react';
import { withRouter } from 'react-router';
import { Tooltip, Position } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import c from 'classnames';

class ViewItem extends React.Component {

  onClick(event, mode) {
    const { location, history } = this.props;
    const parsedHash = queryString.parse(location.hash);
    event.preventDefault();
    parsedHash['preview:mode'] = mode;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {message, mode, activeMode, disabled, icon, href, isPreview} = this.props;
    const isActive = (mode === activeMode);
    const className = c('ViewItem', 'view-item-button',
                        {'active': isActive},
                        {'disabled': disabled});
    return (
        <Tooltip key={mode} content={message} position={Position.RIGHT}>
          <React.Fragment>
            {!disabled && (
              <React.Fragment>
                {!isPreview && (
                  <Link to={href} className={className}>
                    <i className={c('fa', 'fa-fw', icon)} />
                  </Link>
                )}
                {isPreview && (
                  <button onClick={(e) => this.onClick(e, mode)} className={className}>
                    <i className={c('fa', 'fa-fw', icon)} />
                  </button>
                )}
              </React.Fragment>
            )}
            {disabled && (              
              <button className={className} disabled={disabled}>
                <i className={c('fa', 'fa-fw', icon)} />
              </button>
            )}
          </React.Fragment>
        </Tooltip>
    );
  }
}

ViewItem = withRouter(ViewItem);
export default ViewItem;