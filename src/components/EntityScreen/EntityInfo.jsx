import React, { Component } from 'react';

import DualPane from 'components/common/DualPane';

class EntityInfo extends Component {
  render() {
    const { entity } = this.props;
    return (
      <DualPane.InfoPane>
        <h1>{entity.name}</h1>
        <ul>
          <li>{entity.schema}</li>
          <li>{entity.created_at}</li>
          <li>{entity.countries.join(', ')}</li>
        </ul>
      </DualPane.InfoPane>
    );
  }
}

export default EntityInfo;
