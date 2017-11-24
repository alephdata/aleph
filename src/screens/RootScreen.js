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

class RootScreen extends Component {
  render() {
    const { collections } = this.props;
    return (
      <Article>
        <Article.InfoPane>
          <h1>Search for leads with Aleph</h1>
          <p>Search millions of documents and datasets, from public sources, leaks and investigations.</p>
          <p>Aleph's database contains:</p>
          <ul>
            {Object.entries(collections.results).map(([id, collection]) => (
              <li>
                <Link to={getPath(collection.ui)}>
                  {collection.label}
                </Link>
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
  };
};

export default connect(mapStateToProps)(RootScreen);
