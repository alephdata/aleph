import React, { Component } from 'react';
import { min } from 'lodash';

import Country from 'src/components/common/Country';
import Schema from 'src/components/common/Schema';
import Collection from 'src/components/common/Collection';
import Entity from 'src/components/EntityScreen/Entity';
import Date from 'src/components/common/Date';

class EntityListItem extends Component {
  render() {
    const { item, showCollection = true, showCountry = true } = this.props;
    const date = min(item.dates);

    return (
      <tr className={`result result--${item.schema}`}>
        <td className="result__name">
          <Entity.Link entity={item} icon />
        </td>
        {showCollection && 
          <td className="result__collection">
            <Collection.Link collection={item.collection} icon />
          </td>
        }
        <td>
          <Schema.Name schema={item.schema} />
        </td>
        {showCountry && (
          <td>
            <Country.List codes={item.countries} />
          </td>
        )}
        <td>
          <Date value={date} />
        </td>
      </tr>
    );
  }
}

export default EntityListItem;
