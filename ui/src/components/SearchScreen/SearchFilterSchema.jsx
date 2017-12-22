import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Tab2, Tabs2, Tooltip, Position } from "@blueprintjs/core";

import c from 'classnames';
import sumBy from 'lodash/sumBy';

import Schema from 'src/components/common/Schema';

import './SearchFilterSchema.css';

// const SearchFilterSchema = ({ schemas, onChange, currentValue }) => (
//   <ul className="search-filter-schema">
//     <li className={c({'is-selected': !currentValue})} onClick={onChange.bind(null, null)}>
//       <span className="search-filter-schema-type">
//         <FormattedMessage id="search.schema.all" defaultMessage="All results"/><br />
//         <FormattedNumber value={sumBy(schemas, 'count')} />
//       </span>
//     </li>
//     {schemas
//       .sort((a, b) => a.label < b.label ? -1 : 1)
//       .map(schema => (
//         <li className={c({'is-selected': currentValue === schema.id})} onClick={onChange.bind(null, schema.id)} key={schema.id}>
//           <Schema.Icon schema={schema.id} />
//           <span className="search-filter-schema-type">
//             <Schema.Name schema={schema.id} plural />
//             <br />
//             <FormattedNumber value={schema.count} />
//           </span>
//         </li>
//       ))}
//   </ul>
// );

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
    const values = (result && !result.isFetching) ? result.facets.schema.values : [];
  
    return (
      <div className="SearchFilterSchema">
        <Tabs2 onChange={this.tabChange} selectedTabId={current}>
          <Tab2 id={this.ALL}>
            <FormattedMessage id="search.schema.all" defaultMessage="All"/>{' '}
            <FormattedNumber value={sumBy(values, 'count')} />
          </Tab2>
          { values.map((schema) => (
            <Tab2 key={schema.id} id={schema.id}>
              <Tooltip content={schema.label} position={Position.BOTTOM}>
                <span>
                  <Schema.Icon schema={schema.id} />
                  <FormattedNumber value={schema.count} />
                </span>
              </Tooltip>
            </Tab2>
          ))}
        </Tabs2>
      </div> 
    )
  }
}

export default SearchFilterSchema;
