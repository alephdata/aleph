import React, { Component } from 'react';
import { connect } from 'react-redux'

import { fetchCollections, fetchMetadata, fetchSession } from '../actions';
import { Spinner } from "@blueprintjs/core";
import PageNavbar from '../components/PageNavbar';

class PageLayout extends Component {

  componentWillMount() {
    this.props.fetchCollections()
    this.props.fetchMetadata()
    this.props.fetchSession()
  }

  render() {
    var isLoaded = this.props.metadata && this.props.metadata.app && this.props.session;
    if (!isLoaded) {
      return (
        <div>
          <Spinner className="pt-large"></Spinner>
        </div>
      )
    }

    return (
      <div>
        <PageNavbar metadata={this.props.metadata} session={this.props.session} />
        {this.props.children}
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return state;
}

PageLayout = connect(
  mapStateToProps,
  { fetchCollections, fetchMetadata, fetchSession }
)(PageLayout);

export default PageLayout;
