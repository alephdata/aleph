import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { groupBy, map } from 'lodash';

import DualPane from 'components/common/DualPane';

function getPath(url) {
  return new URL(url).pathname;
}

class HomeContent extends Component {
  render() {
    const { collections, categories } = this.props;
    const collectionsByCategory = groupBy(collections.results, 'category');
    return (
      <DualPane.ContentPane>
        <p>Aleph's database contains:</p>
        <ul>
          {map(collectionsByCategory, (group, categoryId) => (
            <li key={categoryId}>
              {categories[categoryId]}
              <ul>
                {group.map(collection => (
                  <li key={collection.id}>
                    <Link to={getPath(collection.ui)}>
                      {collection.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </DualPane.ContentPane>
    );
  }
}

export default HomeContent;
