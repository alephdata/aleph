import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import Query from 'app/Query';
import { queryCollections } from 'actions';

import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import { Breadcrumbs } from 'components/common';
import CollectionIndex from 'components/CollectionIndex/CollectionIndex';
import CaseCreateButton from 'components/Toolbar/CaseCreateButton';

import './CasesIndexScreen.scss';


const messages = defineMessages({
  title: {
    id: 'cases.title',
    defaultMessage: 'Personal datasets',
  },
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'You do not have any personal datasets yet.',
  },
  placeholder: {
    id: 'cases.placeholder',
    defaultMessage: 'Search personal datasets...',
  },
});


export class CasesIndexScreen extends Component {
  render() {
    const { query, intl } = this.props;
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
        className="CasesIndexScreen"
        breadcrumbs={breadcrumbs}
        title={intl.formatMessage(messages.title)}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="case.description"
                defaultMessage="Personal datasets let you upload and share documents and data which belong to a particular story. You can upload PDFs, email archives or spreadsheets, and they will be made easy to search and browse."
              />
            </p>
            <div className="Dashboard__actions">
              <CaseCreateButton />
            </div>
          </div>
          <CollectionIndex
            query={query}
            placeholder={intl.formatMessage(messages.placeholder)}
            noResultsText={intl.formatMessage(messages.no_results_title)}
          />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;

  const context = {
    'filter:category': 'casefile',
  };
  let query = Query.fromLocation('collections', location, context, 'collections')
    .limit(30);

  if (!query.hasSort()) {
    query = query.sortBy('created_at', 'desc');
  }

  return {
    query,
  };
};

export default compose(
  connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(CasesIndexScreen);
