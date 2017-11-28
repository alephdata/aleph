import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';

import Breadcrumbs from 'components/Breadcrumbs';
import Article from 'components/Article';
import SearchScreen_ from './SearchScreen';
const SearchScreen = withRouter(SearchScreen_);

function getPath(url) {
  return new URL(url).pathname;
}

class CollectionScreen extends Component {
  render() {
    const { collection, category } = this.props;
    return (
      <Article>
        <Article.InfoPane>
          <Breadcrumbs>
            <Link to={'/'}><Icon iconName="folder-open" /> Aleph</Link>
            <span>{category}</span>
          </Breadcrumbs>
          <h1>
            <Link to={getPath(collection.ui)}>
              {collection.label}
            </Link>
          </h1>
          <p>{collection.summary}</p>
          Contains:
          <ul>
            {Object.entries(collection.schemata).map(([key, value]) => (
              <li key={key}>{key}: {value}</li>
            ))}
          </ul>
          <p>
            Last update: {collection.updated_at}
          </p>

        </Article.InfoPane>
        <Article.ContentPane>
          <SearchScreen />
        </Article.ContentPane>
      </Article>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections.results[collectionId];
  // TODO handle case where collection is undefined / not loaded yet.
  const category = state.metadata.categories[collection.category];
  return {
    collection,
    category,
  };
};

export default connect(mapStateToProps)(CollectionScreen);
