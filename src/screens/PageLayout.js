import React, {Component} from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import {connect} from 'react-redux'

import {fetchMetadata} from '../actions';
import {Spinner} from "@blueprintjs/core";
import PageNavbar from '../components/PageNavbar';

import SearchScreen from './SearchScreen';
import LoginScreen from "./LoginScreen";
import ErrorScreen from './ErrorScreen';
import LogoutScreen from "./LogoutScreen";

class PageLayout extends Component {

  componentWillMount() {
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
      <div>
        <PageNavbar metadata={this.props.metadata} session={this.props.session}/>
        <main>
          <Switch>
            <Redirect exact from="/" to="/search"/>
            <Route path="/search" exact component={SearchScreen}/>
            <Route path="/login" exact component={LoginScreen}/>
            <Route path="/logout" exact component={LogoutScreen}/>
            <Route component={ErrorScreen}/>
          </Switch>
        </main>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return state;
};

PageLayout = connect(
  mapStateToProps,
  {fetchMetadata}
)(PageLayout);

export default PageLayout;
