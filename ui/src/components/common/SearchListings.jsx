import React, { PureComponent } from 'react';
import { Button, Icon, Tooltip } from '@blueprintjs/core';
import SearchAlert from 'src/components/SearchAlert/SearchAlert';
// import c from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';
import { Date, QueryText, Skeleton } from 'src/components/common';

import './SearchListings.scss';

const messages = defineMessages({
  add_placeholder: {
    id: 'queryLogs.add_placeholder',
    defaultMessage: 'Keep track of searches...',
  },
  no_alerts: {
    id: 'queryLogs.no_alerts',
    defaultMessage: 'You are not tracking any searches',
  },
  search_query: {
    id: 'queryLogs.query.search',
    defaultMessage: 'Search for {query}',
  },
  delete_query: {
    id: 'queryLogs.query.delete.tooltip',
    defaultMessage: 'Remove from {listType}',
  },
});

export class SearchListings extends PureComponent {
  renderSkeleton() {
    const { listType } = this.props;

    const skeletonItems = [...Array(5).keys()];

    return (
      <table className="SearchListings settings-table">
        <tbody>
          {skeletonItems.map(item => (
            <tr key={item} className="SearchListings__row">
              <td className="SearchListings__button narrow">
                <Skeleton.Text type="span" length={1} />
              </td>
              <td className="SearchListings__text text-main">
                <Skeleton.Text type="span" length={40} />
              </td>
              <td className="SearchListings__text text-date">
                <Skeleton.Text type="span" length={15} />
              </td>
              {listType === 'search history' && (
                <td className="SearchListings__button narrow">
                  <Skeleton.Text type="span" length={1} />
                </td>
              )}
              <td className="SearchListings__button narrow">
                <Skeleton.Text type="span" length={1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render() {
    const { listType, result, onDelete, onSearch, intl } = this.props;
    if (!result.results && (result.isLoading || result.shouldLoad)) {
      return this.renderSkeleton();
    }
    const items = result.results;

    return (
      <table className="SearchListings settings-table">
        <tbody>
          {items.map(item => (
            <tr key={item.id || item.last} className="SearchListings__row">
              <td className="SearchListings__button narrow">
                {listType === 'search history' && (
                  <Tooltip
                    content={intl.formatMessage(messages.search_query, { query: item.query })}
                  >
                    <Button
                      icon="search"
                      minimal
                      small
                      onClick={() => onSearch(item)}
                    />
                  </Tooltip>
                )}
                {listType === 'alerts' && (
                  <Icon className="bp3-intent-primary" icon="feed-subscribed" />
                )}
              </td>
              <td className="SearchListings__text text-main">
                <QueryText query={item.query} />
              </td>
              <td className="SearchListings__text text-date">
                <Date value={item.updated_at || item.last} showTime />
              </td>
              {listType === 'search history' && (
                <td className="SearchListings__button narrow">
                  <SearchAlert queryText={item.query} />
                </td>
              )}
              <td className="SearchListings__button narrow">
                <Tooltip
                  content={intl.formatMessage(messages.delete_query, { listType })}
                >
                  <Button
                    icon="cross"
                    minimal
                    small
                    onClick={() => onDelete(item)}
                  />
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
export default injectIntl(SearchListings);
