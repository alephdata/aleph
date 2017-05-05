import React, { Component } from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import queryString from 'query-string';

import { fetchDocuments } from '../store/actions';

import DocumentsContainer from '../containers/DocumentsContainer';
import Search from '../components/Search';

const SearchWithRouter = withRouter(Search);

class DocumentsScreen extends Component {
  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    // should account for multiple filters in the future
    if (this.props.filters.search !== prevProps.filters.search) {
      this.fetchData();
    }
  }

  fetchData() {
    const { filters, fetchDocuments } = this.props;
    fetchDocuments(filters);
  }

  render() {
    return (
      <div>
        <SearchWithRouter />
        <DocumentsContainer />
      </div>      
    )
  }
}

const mapStateToProps = (state, { location }) => {
  const params = queryString.parse(location.search);

  return {
    filters: {
      search: params.search
    }
  };
}

DocumentsScreen = connect(
  mapStateToProps,
  { fetchDocuments }
)(DocumentsScreen);

export default DocumentsScreen;