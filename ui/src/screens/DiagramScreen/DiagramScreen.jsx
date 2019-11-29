import React, { Component } from 'react';
// import { FormattedMessage } from 'react-intl';
// import queryString from 'query-string';
import { compose } from 'redux';
// import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Screen from 'src/components/Screen/Screen';
import { Diagram } from 'src/components/Diagram';


export class DiagramScreen extends Component {
  // constructor(props) {
  //   super(props);
  // }
  render() {
    return (
      <Screen
        title="placeholder"
        description="placeholder"
        searchScopes={[]}
      >
        <Diagram />
      </Screen>
    );
  }
}

//
// const mapStateToProps = (state, ownProps) => {
//
//   return {};
// };


export default compose(
  withRouter,
  // connect(mapStateToProps),
)(DiagramScreen);
