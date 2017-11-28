import React, { Component } from 'react';

import Article from 'components/Article';

class EntityContent extends Component {
  render() {
    const { entity } = this.props;
    return (
      <Article.ContentPane>
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
      </Article.ContentPane>
    );
  }
}

export default EntityContent;
