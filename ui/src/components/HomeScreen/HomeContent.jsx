import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { groupBy, map } from 'lodash';

import Category from 'src/components/CollectionScreen/Category';
import DualPane from 'src/components/common/DualPane';
import getPath from 'src/util/getPath';

class HomeContent extends Component {
  render() {
    const { collections } = this.props;
    const collectionsByCategory = groupBy(collections, 'category');
    return (
      <DualPane.ContentPane>
        <ul>
          {map(collectionsByCategory, (group, categoryId) => (
            <li key={categoryId}>
              <Category category={categoryId} />
              <ul>
                {group.map(collection => (
                  <li key={collection.id}>
                    <Link to={getPath(collection.links.ui)}>
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
