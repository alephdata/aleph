import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab, Tabs } from "@blueprintjs/core";
import sumBy from 'lodash/sumBy';

import Schema from 'src/components/common/Schema';

import './SearchFilterSchema.css';

class SearchFilterSchema extends Component {
  constructor(props)  {
    super(props);
    this.ALL = 'ALL';
    this.tabChange = this.tabChange.bind(this);
  }

  tabChange(tabId) {
    const { updateQuery, query } = this.props;
    if (tabId === this.ALL) {
      updateQuery(query.setFilter('schema', []));
    } else {
      updateQuery(query.setFilter('schema', tabId));
    }
  }

  render() {
    const { result, query } = this.props;
    const current = query.getFilter('schema') + '' || this.ALL;
    const values = (result && result.facets && result.facets.schema)
      ? result.facets.schema.values
      : [];
  
    return (
      <div className="SearchFilterSchema">
        <Tabs onChange={this.tabChange} selectedTabId={current}>
          <Tab id={this.ALL}>
            <FormattedMessage id="search.schema.all" defaultMessage="All"/>
            <span className="count">
              <FormattedNumber value={sumBy(values, 'count')} />
            </span>
          </Tab>
          { values.map((schema) => (
            <Tab key={schema.id} id={schema.id}>
              <Schema.Icon schema={schema.id} />
              <Schema.Name plural schema={schema.id} />
              <span className="count">
                <FormattedNumber value={schema.count} />
              </span>
            </Tab>
          ))}
        </Tabs>
      </div> 
    )
  }
}

export default SearchFilterSchema;
