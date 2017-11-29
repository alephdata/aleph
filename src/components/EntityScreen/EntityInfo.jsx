import React, { Component } from 'react';

import DualPane from 'components/common/DualPane';

class EntityInfo extends Component {
  render() {
    const { name, schema, created_at, countries = [] } = this.props.entity;
    return (
      <DualPane.InfoPane>
        <h1>{name}</h1>
        <ul>
          <li>{schema}</li>
          <li>{created_at}</li>
          <li>{countries.join(', ')}</li>
        </ul>
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
