import React, { PureComponent } from 'react';

import DualPane from 'src/components/common/DualPane';
import EntityReferences from './EntityReferences';

class EntityContent extends PureComponent {
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
