import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import EntityListItem from './EntityListItem';

import './EntityList.css';

class EntityList extends Component {
  render() {
    const { result, aspects } = this.props;

    if (!result || !result.results || result.total === 0) {
      return null;
    }
    
    return (
      <table className="results-table pt-table pt-bordered">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="entity.list.name" defaultMessage="Name"/>
            </th>
            {aspects.collections && 
              <th>
                <FormattedMessage id="entity.list.collection" defaultMessage="Collection"/>
              </th>
            }
            <th>
              <FormattedMessage id="entity.list.schema" defaultMessage="Type"/>
            </th>
            {aspects.countries && (
              <th>
                <FormattedMessage id="entity.list.country" defaultMessage="Country"/>
              </th>
            )}
            <th>
              <FormattedMessage id="entity.list.date" defaultMessage="Date"/>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.results.map(item =>
            <EntityListItem key={item.id} item={item} aspects={aspects} />
          )}
        </tbody>
      </table>
    );
  }
}

export default EntityList;
