import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import c from 'classnames';

import messages from 'src/content/messages';
import EntityListItem from './EntityListItem';

import './EntityList.css';

class EntityList extends Component {
  sortColumn(field) {
    const { query, updateQuery } = this.props;
    const { field: sortedField, desc } = query.getSort();
    // Toggle through sorting states: ascending, descending, or unsorted.
    let newQuery
    if (sortedField !== field) {
      newQuery = query.sortBy(field, false);
    } else {
      if (!desc) {
        newQuery = query.sortBy(field, true);
      } else {
        newQuery = query.sortBy(null);
      }
    }
    updateQuery(newQuery);
  }

  render() {
    const { result, aspects, query, intl } = this.props;

    if (!result || !result.results || result.total === 0) {
      return null;
    }

    const TH = ({ field, ...otherProps }) => {
      const { field: sortedField, desc } = query.getSort();
      const isSorted = sortedField === field;
      return (
        <th onClick={() => this.sortColumn(field)} {...otherProps}>
          <div>
            {/* <FormattedMessage id={`entity.list.${field}`} /> */}
            {intl.formatMessage(messages.entity.list[field])}
            <span className={c('caret', 'pt-icon-large',
                               `pt-icon-caret-${isSorted && desc ? 'up' : 'down'}`,
                               { 'hidden': !isSorted },
                             )}/>
          </div>
        </th>
      );
    }

    return (
      <table className="EntityList data-table">
        <thead>
          <tr>
            <TH field="name" className="wide" />
            {aspects.collections && 
              <TH field="collection_id" />
            }
            <TH field="schema" />
            {aspects.countries && (
              <TH field="countries" />
            )}
            <TH field="dates" />
          </tr>
        </thead>
        <tbody>
          {result.results.map(entity =>
            <EntityListItem key={entity.id} entity={entity} aspects={aspects} />
          )}
        </tbody>
      </table>
    );
  }
}

export default injectIntl(EntityList);
