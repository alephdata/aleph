import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchCollections, fetchMetadata } from 'src/actions';
import LoginScreen from 'src/components/auth/LoginScreen';
import LogoutScreen from 'src/components/auth/LogoutScreen';
import SignupScreen from 'src/components/auth/SignupScreen';
import ActivateScreen from 'src/components/auth/ActivateScreen';
import EntityScreen from 'src/components/EntityScreen';
import DocumentScreen from 'src/components/DocumentScreen';
import HomeScreen from 'src/components/HomeScreen';
import CollectionScreen from 'src/components/CollectionScreen';
import ErrorScreen from 'src/components/ErrorScreen';
import PageNavbar from './PageNavbar';

import './PageLayout.css';

class PageLayout extends Component {

  componentWillMount() {
    this.props.fetchCollections();
    this.props.fetchMetadata();
  }

  render() {
    const isLoaded = this.props.metadata && this.props.metadata.app && this.props.session;
    if (!isLoaded) {
      return (
        <div>
          <Spinner className="pt-large"/>
        </div>
      )
    }

    return (
      <div className="PageLayout-root">
        <PageNavbar metadata={this.props.metadata} session={this.props.session}/>
        <main className="PageLayout-main">
          <Switch>
            <Route path="/login" exact component={LoginScreen}/>
            <Route path="/logout" exact component={LogoutScreen}/>
            <Route path="/signup" exact component={SignupScreen}/>
            <Route path="/activate/:code" exact component={ActivateScreen}/>
            <Route path="/entities/:entityId" exact component={EntityScreen}/>
            <Route path="/documents/:documentId" exact component={DocumentScreen}/>
            <Route path="/collections/:collectionId" exact component={CollectionScreen}/>
            <Route path="/" exact component={HomeScreen}/>
            <Route component={ErrorScreen}/>
          </Switch>
        </main>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return state;
};

PageLayout = connect(
  mapStateToProps,
  { fetchCollections, fetchMetadata }
)(PageLayout);

export default PageLayout;
