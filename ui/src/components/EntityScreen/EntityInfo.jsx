import React, { Component } from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import Property from './Property';
import DualPane from 'src/components/common/DualPane';
import CollectionSection from 'src/components/CollectionScreen/CollectionSection';

class EntityInfo extends Component {
  render() {
    const { name, schema, collection, properties, updated_at } = this.props.entity;
    return (
      <DualPane.InfoPane>
        <h1>
          <Schema.Icon schema={schema} />
          {name}
        </h1>

        <Property.Table properties={properties} schema={schema}>
          <tr>
            <th>
              <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
            </th>
            <td>
              <FormattedDate value={updated_at} />
            </td>
          </tr>
        </Property.Table>

        <CollectionSection collection={collection} />
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
