import React, { Component } from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';

import Schema from 'src/components/common/Schema';
import Property from './Property';
import Entity from './Entity';
import DualPane from 'src/components/common/DualPane';
import CollectionSection from 'src/components/CollectionScreen/CollectionSection';

class EntityInfo extends Component {
  render() {
    const { schema, collection, properties, updated_at } = this.props.entity;
    return (
      <DualPane.InfoPane>
        <h1>
          <Schema.Icon schema={schema} />
          <Entity.Label entity={this.props.entity} />
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

        {collection &&
          <CollectionSection collection={collection} />
        }
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
