import React, { Component } from 'react';
import { connect } from 'react-redux'
// import queryString from 'query-string';

import { fetchMetadata } from '../store/actions';

class Layout extends Component {
  componentWillMount() {
    this.props.fetchMetadata()
  }

  render() {
    return (
      <div>
        <h3>Aleph test</h3>
        {this.props.children}
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return ownProps;
}

Layout = connect(
  mapStateToProps,
  { fetchMetadata }
)(Layout);

export default Layout;
