import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { groupBy, map } from 'lodash';
import { Icon } from '@blueprintjs/core';

import Breadcrumbs from '../components/Breadcrumbs';
import Article from '../components/Article';
import SearchScreen_ from './SearchScreen';
const SearchScreen = withRouter(SearchScreen_);

import './RootScreen.css';

function getPath(url) {
  return new URL(url).pathname;
}

class RootScreen extends Component {
  render() {
    const { collections, categories } = this.props;
    const collectionsByCategory = groupBy(collections.results, 'category');
    return (
      <Article>
        <Article.InfoPane>
          <Breadcrumbs root>
            <Link to={'/'}><Icon iconName="folder-open" /></Link>
          </Breadcrumbs>
          <h1>
            <Link to={'/'}>
              Aleph
            </Link>
          </h1>
          <p className="tagline"><em>93,801,670</em><br />leads for your investigations</p>
          <p>Search millions of documents and datasets, from public sources, leaks and investigations.</p>
          <p>Aleph's database contains:</p>
          <ul>
            {map(collectionsByCategory, (group, categoryId) => (
              <li key={categoryId}>
                <Link to={getPath(categories[categoryId].ui)}>
                  {categories[categoryId].label}
                </Link>
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
        </Article.InfoPane>
        <Article.ContentPane>
          <SearchScreen />
        </Article.ContentPane>
      </Article>
    )
  }
}

const mapStateToProps = state => {
  return {
    collections: state.collections,
    categories: state.metadata.categories,
  };
};

export default connect(mapStateToProps)(RootScreen);
