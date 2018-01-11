import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';
import EntityReferences from './EntityReferences';

class EntityContent extends Component {
  render() {
    const { entity } = this.props;

    return (
      <DualPane.ContentPane>
        <EntityReferences entity={entity} />
      </DualPane.ContentPane>
    );
  }
}

export default EntityContent;
