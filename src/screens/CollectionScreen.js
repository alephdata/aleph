import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Article from '../components/Article';
import SearchScreen_ from './SearchScreen';
const SearchScreen = withRouter(SearchScreen_);

class CollectionScreen extends Component {
  render() {
    const { collection } = this.props;
    return (
      <Article>
        <Article.InfoPane>
          <h1>
            {collection.label}
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
  return {
    collection: state.collections.results[collectionId],
  };
};

export default connect(mapStateToProps)(CollectionScreen);
