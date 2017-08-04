import React, {Component} from 'react';
import {Route, Switch, Redirect} from 'react-router-dom';
import {connect} from 'react-redux'

import {fetchMetadata, fetchSession} from '../actions';
import {Spinner} from "@blueprintjs/core";
import PageNavbar from '../components/PageNavbar';

import SearchScreen from './SearchScreen';
import ErrorScreen from './ErrorScreen';

class PageLayout extends Component {

  componentWillMount() {
    this.props.fetchMetadata();
    this.props.fetchSession();
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
  {fetchMetadata, fetchSession}
)(PageLayout);

export default PageLayout;
