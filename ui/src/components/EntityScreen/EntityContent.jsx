import React, { Component } from 'react';

import DualPane from 'src/components/common/DualPane';

class EntityContent extends Component {
  render() {
    const { properties = {} } = this.props.entity;
    return (
      <DualPane.ContentPane>
        <dl>
          {Object.entries(properties).map(([property, values]) => ([
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
