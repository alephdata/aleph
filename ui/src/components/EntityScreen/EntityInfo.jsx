import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import Property from './Property';
import Entity from './Entity';
import DualPane from 'src/components/common/DualPane';
import Date from 'src/components/common/Date';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';

import './EntityInfo.css';

class EntityInfo extends Component {
  render() {
    const { schema, collection, properties, updated_at } = this.props.entity;
    return (
      <DualPane.InfoPane>
        <h1 className='entity_info_border'>
          <Entity.Label entity={this.props.entity} addClass={true}/>
        </h1>

        <Property.Table classTable='entity_table' classTh='th_class' classTd='td_class' properties={properties} schema={schema}>
          <tr>
            <th className='th_class'>
              <FormattedMessage id="entity.updated" defaultMessage="Last updated"/>
            </th>
            <td className='td_class'>
              <Date value={updated_at} />
            </td>
          </tr>
        </Property.Table>

        <h3 className="entity_info_origin entity_info_border">
          <FormattedMessage id="collection.section" defaultMessage="Origin"/>
        </h3>
          <div className="collection_card_entity_info">
              <CollectionCard collection={collection} />
          </div>

      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
