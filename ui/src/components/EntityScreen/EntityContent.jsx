import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';

class EntityContent extends Component {
  render() {
    // const { properties = {} } = this.props.entity;
    return (
      <DualPane.ContentPane>
        <pre>
          { JSON.stringify(this.props.entity, null, 2) }
        </pre>
      </DualPane.ContentPane>
    );
  }
}

export default EntityContent;
