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
    const {message, mode, activeMode, icon, href, isPreview} = this.props;
    const isActive = (mode === activeMode);
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

ViewItem = withRouter(ViewItem);
export default ViewItem;