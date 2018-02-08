import React, { Component } from 'react';
import { injectIntl } from 'react-intl';

import messages from 'src/content/messages';
import EntityListItem from './EntityListItem';
import SortableTH from 'src/components/common/SortableTH';


class EntityList extends Component {
  sortColumn(field) {
    const { query, updateQuery } = this.props;
    const { field: sortedField, desc } = query.getSort();
    // Toggle through sorting states: ascending, descending, or unsorted.
    let newQuery;
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

    const TH = ({ sortable, field, ...otherProps }) => {
      const { field: sortedField, desc } = query.getSort();
      return (
        <SortableTH sortable={sortable}
                    sorted={sortedField === field && (desc ? 'desc' : 'asc')}
                    onClick={() => this.sortColumn(field)}
                    {...otherProps}>
          {/* <FormattedMessage id={`entity.list.${field}`} /> */}
          {intl.formatMessage(messages.entity.list[field])}
        </SortableTH>
      );
    }

    return (
      <table className="data-table">
        <thead>
          <tr>
            <TH field="name" className="wide" sortable={true} />
            {aspects.collections && 
              <TH field="collection_id" />
            }
            <TH field="schema" />
            {aspects.countries && (
              <TH field="countries" sortable={true} />
            )}
            <TH field="dates" sortable={true} />
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
