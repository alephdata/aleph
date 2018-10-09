import React from 'react';
import {withRouter} from 'react-router';
import {AnchorButton, Position, Tooltip} from '@blueprintjs/core';
import {Link} from 'react-router-dom';
import queryString from 'query-string';
import c from 'classnames';
import NotificationBadge from 'react-notification-badge';
import Icon from "src/components/common/Icon";

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
    const {message, mode, activeMode, icon, href, isPreview, count} = this.props;
    const isActive = (mode === activeMode);
    const className = c('ViewItem', 'view-item-button',
                        {'active': isActive},
                        {'disabled': count === 0});
    const iconComponent = <Icon
      name={icon}
    />;
    return (
        <Tooltip key={mode} content={message} position={Position.RIGHT}>
          <React.Fragment>
            {!(count === 0) && (
              <React.Fragment>
                {!isPreview && (
                  <Link to={href} className={className}>
                    {count && <NotificationBadge count={count}
                                                 className='badge-item'/>}
                    {iconComponent}
                  </Link>
                )}
                {isPreview && (
                  <button onClick={(e) => this.onClick(e, mode)} className={className}>
                    {count && <NotificationBadge count={count}
                                                 className='badge-item'/>}
                    {iconComponent}
                  </button>
                )}
              </React.Fragment>
            )}
            {(count === 0) && (
              <AnchorButton className={className} disabled={true}>
                {iconComponent}
              </AnchorButton>
            )}
          </React.Fragment>
        </Tooltip>
    );
  }
}

ViewItem = withRouter(ViewItem);
export default ViewItem;