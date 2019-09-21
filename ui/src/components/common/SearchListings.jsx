import React, { PureComponent } from 'react';
import { Button, Tooltip } from '@blueprintjs/core';
import SearchAlert from 'src/components/SearchAlert/SearchAlert';
// import c from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';
import {
  Date,
} from 'src/components/common';

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
  render() {
    const { listType, items, onDelete, onSearch, intl } = this.props;

    return (
      <table className="SearchListings settings-table">
        <tbody>
          {items.map(item => (
            <tr key={item.id || item.last} className="SearchListings__row">
              <td className="SearchListings__button narrow">
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
              </td>
              <td className="SearchListings__text text-main">
                {item.query}
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
