import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import messages from 'src/content/messages';

import EntityListItem from './EntityListItem';

import './EntityList.css';

class EntityList extends Component {
  render() {
    const { result, aspects, intl } = this.props;

    if (!result || !result.results || result.total === 0) {
      return null;
    }

    const TH = ({ field }) => (
      <th>
        {/* <FormattedMessage field={`entity.list.${field}`} /> */}
        {intl.formatMessage(messages.entity.list[field])}
      </th>
    );

    return (
      <table className="results-table pt-html-table pt-html-table-bordered">
        <thead>
          <tr>
            <TH field="name" />
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
          {result.results.map(item =>
            <EntityListItem key={item.id} item={item} aspects={aspects} />
          )}
        </tbody>
      </table>
    );
  }
}

export default injectIntl(EntityList);
