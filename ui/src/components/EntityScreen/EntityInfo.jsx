import React, { Component } from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import Property from './Property';
import DualPane from 'src/components/common/DualPane';

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

        <h3>Origin</h3>
        <strong>{ collection.label }</strong>
        <p>{ collection.summary }</p>
        <p><FormattedDate value={collection.updated_at} /></p>
        <p>Contains entries from: <Country.List codes={ collection.countries } /></p>
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
