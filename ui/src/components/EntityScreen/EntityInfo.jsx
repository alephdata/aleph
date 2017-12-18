import React, { Component } from 'react';

import Schema from 'src/components/common/Schema';
import DualPane from 'src/components/common/DualPane';

class EntityInfo extends Component {
  render() {
    const { name, schema, created_at, collection, countries = [] } = this.props.entity;
    return (
      <DualPane.InfoPane>
        <h1>
          <Schema.Icon schema={schema} />
          {name}
        </h1>
        <ul>
          <li>{schema}</li>
          <li>{created_at}</li>
          <li>{countries.join(', ')}</li>
        </ul>

        <h3>Origin</h3>
        <strong>{ collection.label }</strong>
        <p>{ collection.summary }</p>
        <p>{ collection.updated_at }</p>
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
