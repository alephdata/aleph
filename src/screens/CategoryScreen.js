import filter from 'lodash/filter';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';

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
          <h1>{category.label}</h1>
          <p>{category.summary}</p>
          Collections:
          <ul>
            {collections.map(collection => (
              <li>
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
  // TODO add category info to back-end.
  // const category = state.metadata.categories[categoryId]; (or somewhere)
  const category = {
    summary: 'Bla bla some info about this category (to be added to the API).',
    label: categoryId[0].toUpperCase() + categoryId.slice(1),
  }
  const collections = filter(state.collections.results, {category: categoryId});
  return {
    category,
    collections,
  };
};

export default connect(mapStateToProps)(CategoryScreen);
