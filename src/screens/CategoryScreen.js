import filter from 'lodash/filter';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';

import Breadcrumbs from '../components/Breadcrumbs';
import Article from '../components/Article';
import SearchScreen_ from './SearchScreen';
const SearchScreen = withRouter(SearchScreen_);

function getPath(url) {
  return new URL(url).pathname;
}

class CategoryScreen extends Component {
  render() {
    const { category, collections } = this.props;
    return (
      <Article>
        <Article.InfoPane>
          <Breadcrumbs>
            <Link to={'/'}><Icon iconName="folder-open" /> Aleph</Link>
          </Breadcrumbs>
          <h1>
            <Link to={getPath(category.ui)}>
              {category.label}
            </Link>
          </h1>
          <p>{category.summary}</p>
          Collections:
          <ul>
            {collections.map(collection => (
              <li key={collection.id}>
                <Link to={getPath(collection.ui)}>
                  {collection.label}
                </Link>
              </li>
              )
            )}
          </ul>
        </Article.InfoPane>
        <Article.ContentPane>
          <SearchScreen />
        </Article.ContentPane>
      </Article>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { categoryId } = ownProps.match.params;
  const category = state.metadata.categories[categoryId];
  const collections = filter(state.collections.results, {category: category.id});
  return {
    category,
    collections,
  };
};

export default connect(mapStateToProps)(CategoryScreen);
