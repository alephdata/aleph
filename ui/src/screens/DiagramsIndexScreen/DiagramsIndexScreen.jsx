import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
// import queryString from 'query-string';
import { compose } from 'redux';
// import { connect } from 'react-redux';

import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import {
  Breadcrumbs,
} from 'src/components/common';
import CaseCreateButton from 'src/components/Toolbar/CaseCreateButton';


const messages = defineMessages({
  title: {
    id: 'diagrams.title',
    defaultMessage: 'Diagrams',
  },
  no_results_title: {
    id: 'diagrams.no_results_title',
    defaultMessage: 'You do not have any diagrams yet',
  },
});

export class DiagramsIndexScreen extends Component {
  // constructor(props) {
  //   super(props);
  // }

  // componentDidMount() {
  //   this.fetchIfNeeded();
  // }
  //
  // componentDidUpdate() {
  //   this.fetchIfNeeded();
  // }

  // fetchIfNeeded() {
  //   const { query, result } = this.props;
  //   if (result.shouldLoad) {
  //     this.props.queryCollections({ query });
  //   }
  // }

  render() {
    const { intl } = this.props;

    const breadcrumbs = (
      <Breadcrumbs>
        <li>
          <FormattedMessage
            id="cases.browser.breadcrumb"
            defaultMessage="Cases overview"
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
              <CaseCreateButton />
            </div>
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="case.description"
                defaultMessage="Personal datasets let you upload and share documents and data which belong to a particular story. You can upload PDFs, email archives or spreadsheets, and they will be made easy to search and browse."
              />
            </p>
          </div>
        </Dashboard>
      </Screen>
    );
  }
}

// const mapStateToProps = (state, ownProps) => {
//   const { location } = ownProps;
//   const context = {
//     facet: ['countries', 'team.name'],
//     'filter:kind': 'casefile',
//   };
//   const query = Query.fromLocation('collections', location, context, 'collections')
//     .sortBy('updated_at', 'desc')
//     .limit(30);
//
//   return {
//     query,
//     result: selectCollectionsResult(state, query),
//   };
// };


export default compose(
  // connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(DiagramsIndexScreen);
