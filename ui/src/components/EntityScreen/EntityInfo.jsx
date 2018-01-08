import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import Property from './Property';
import Entity from './Entity';
import DualPane from 'src/components/common/DualPane';
import Date from 'src/components/common/Date';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';

class EntityInfo extends Component {
  render() {
    const { schema, collection, properties, updated_at } = this.props.entity;
    return (
      <DualPane.InfoPane>
        <h1>
          <Entity.Label entity={this.props.entity} />
        </h1>

        <Property.Table properties={properties} schema={schema}>
          <tr>
            <th>
              <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
            </th>
            <td>
              <Date value={updated_at} />
            </td>
          </tr>
        </Property.Table>

        <h3>
          <FormattedMessage id="collection.section" defaultMessage="Origin"/>
        </h3>
        <CollectionCard collection={collection} />
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
