import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';

import { fetchCollections, fetchMetadata } from 'actions';
import LoginScreen from 'components/auth/LoginScreen';
import LogoutScreen from 'components/auth/LogoutScreen';
import SignupScreen from 'components/auth/SignupScreen';
import ActivateScreen from 'components/auth/ActivateScreen';
import EntityScreen from 'components/EntityScreen';
import HomeScreen from 'components/HomeScreen';
import CollectionScreen from 'components/CollectionScreen';
import ErrorScreen from 'components/ErrorScreen';
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
            <Route path="/entities/:entityId" component={EntityScreen}/>
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
