import React, { Component } from 'react';
import { min } from 'lodash';

import Country from 'src/components/common/Country';
import Schema from 'src/components/common/Schema';
import Collection from 'src/components/common/Collection';
import Entity from 'src/components/EntityScreen/Entity';
import Date from 'src/components/common/Date';

class EntityListItem extends Component {
  render() {
    const { entity, aspects } = this.props;
    const date = min(entity.dates);

    return (
      <tr className={`nowrap`}>
        <td className="entity">
          <Entity.Link entity={entity} icon />
        </td>
        {aspects.collections && 
          <td className="collection">
            <Collection.Link collection={entity.collection} icon />
          </td>
        }
        <td className="schema">
          <Schema.Name schema={entity.schema} />
        </td>
        {aspects.countries && (
          <td className="country">
            <Country.List codes={entity.countries} />
          </td>
        )}
        <td className="date">
          <Date value={date} />
        </td>
      </tr>
    );
  }
}

export default EntityListItem;
