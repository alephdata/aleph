import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
// import _ from 'lodash';
// import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryDiagrams } from 'src/actions';
import { selectDiagramsResult } from 'src/selectors';
import Query from 'src/app/Query';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import {
  Breadcrumbs,
} from 'src/components/common';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import DiagramCreateButton from 'src/components/Toolbar/DiagramCreateButton';
import DiagramList from 'src/components/Diagram/DiagramList';


import './DiagramsIndexScreen.scss';

const messages = defineMessages({
  title: {
    id: 'diagrams.title',
    defaultMessage: 'Network diagrams',
  },
  no_results_title: {
    id: 'diagrams.no_results_title',
    defaultMessage: 'You do not have any network diagrams yet',
  },
});

export class DiagramsIndexScreen extends Component {
  // constructor(props) {
  //   super(props);
  // }

  // componentDidUpdate() {
  //   this.fetchIfNeeded();
  // }
  //
  // fetchIfNeeded() {
  //   const { diagrams } = this.props;
  //   if (!diagrams || _.isEmpty(diagrams)) {
  //     this.props.fetchDiagrams();
  //   }
  // }

  render() {
    const { intl, query, result } = this.props;

    console.log(result);

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    const breadcrumbs = (
      <Breadcrumbs>
        <li>
          <FormattedMessage
            id="cases.browser.breadcrumb"
            defaultMessage="Diagrams"
          />
        </li>
      </Breadcrumbs>
    );

    return (
      <Screen
        className="DiagramsIndexScreen"
        breadcrumbs={breadcrumbs}
        title={intl.formatMessage(messages.title)}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <div className="Dashboard__actions">
              <DiagramCreateButton />
            </div>
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="diagram.description"
                defaultMessage="Network diagrams let you visualize complex relationships within a dataset."
              />
            </p>
          </div>
          <DiagramList query={query} />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  console.log('hello', state);
  const { location } = ownProps;
  const query = Query.fromLocation('diagrams', location, {}, 'diagrams');
  const result = selectDiagramsResult(state, query);

  return {
    query,
    result,
  };
};


export default compose(
  connect(mapStateToProps, { queryDiagrams }),
  injectIntl,
)(DiagramsIndexScreen);
