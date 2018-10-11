import React from 'react';
import { withRouter } from 'react-router';
import { Tooltip, Position, AnchorButton } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import c from 'classnames';
import NotificationBadge from 'react-notification-badge';

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
    return (
        <Tooltip key={mode} content={message} position={Position.RIGHT}>
          <React.Fragment>
            {!(count === 0) && (
              <React.Fragment>
                {!isPreview && (
                  <Link to={href} className={className}>
                    {count && <NotificationBadge count={count}
                                                 className='badge-item'/>}
                    {/*<Icon d='M150 0 L75 200 L225 200 Z' />*/}
                    {/*<img src='./icons/Airplane.svg'/>*/}
                    <i className={c('fa', 'fa-fw', icon)} />
                  </Link>
                )}
                {isPreview && (
                  <button onClick={(e) => this.onClick(e, mode)} className={className}>
                    {count && <NotificationBadge count={count}
                                                 className='badge-item'/>}
                    {/*<Icon d='M150 0 L75 200 L225 200 Z' />*/}
                    {/*<img src='./icons/Airplane.svg'/>*/}
                    <i className={c('fa', 'fa-fw', icon)} />
                  </button>
                )}
              </React.Fragment>
            )}
            {(count === 0) && (
              <AnchorButton className={className} disabled={true}>
                {/*<img src='./icons/Airplane.svg'/>*/}
                <i className={c('fa', 'fa-fw', icon)} />
              </AnchorButton>
            )}
          </React.Fragment>
        </Tooltip>
    );
  }
}

ViewItem = withRouter(ViewItem);
export default ViewItem;