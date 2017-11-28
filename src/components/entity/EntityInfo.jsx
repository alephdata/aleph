import React, { Component } from 'react';

import Article from 'components/Article';

class EntityInfo extends Component {
  render() {
    const { entity } = this.props;
    return (
      <Article.InfoPane>
        <h1>{entity.name}</h1>
        <ul>
          <li>{entity.schema}</li>
          <li>{entity.created_at}</li>
          <li>{entity.countries.join(', ')}</li>
        </ul>
      </Article.InfoPane>
    );
  }
}

export default EntityInfo;
