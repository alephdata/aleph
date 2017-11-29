import React, { Component } from 'react';

import DualPane from 'components/common/DualPane';

class EntityContent extends Component {
  render() {
    const { entity } = this.props;
    return (
      <DualPane.ContentPane>
        <dl>
          {Object.entries(entity.properties).map(([property, values]) => ([
            <dt>{property}</dt>,
            <dd>
              {values.length === 1
                ? values[0]
                : (
                  <ul>
                    {values.map(value => (
                      <li>{value}</li>
                    ))}
                  </ul>
                )
              }
            </dd>
          ]))}
        </dl>
      </DualPane.ContentPane>
    );
  }
}

export default EntityContent;
