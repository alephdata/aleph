import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import messages from 'src/content/messages';

import EntityListItem from './EntityListItem';

class EntityList extends Component {
  sortColumn(field) {
    const { query, updateQuery } = this.props;
    const { field: sortedField, desc } = query.getSort();
    const newQuery = query.sortBy(field, (sortedField === field && !desc));
    updateQuery(newQuery);
  }

  render() {
    const { result, aspects, query, intl } = this.props;

    if (!result || !result.results || result.total === 0) {
      return null;
    }

    const TH = ({ field, ...otherProps }) => (
      <th onClick={() => this.sortColumn(field)} {...otherProps}>
        {/* <FormattedMessage field={`entity.list.${field}`} /> */}
        {intl.formatMessage(messages.entity.list[field])}
        {query.getSort().field === field &&
          <span className={`pt-icon-standard pt-icon-caret-${query.getSort().desc ? 'up' : 'down'}`}/>
        }
      </th>
    );

    return (
      <table className="data-table">
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
