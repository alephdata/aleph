{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import CollectionIndex from 'components/CollectionIndex/CollectionIndex';
import InvestigationCreateButton from 'components/Toolbar/InvestigationCreateButton';
import { investigationsQuery } from 'queries';


const messages = defineMessages({
  title: {
    id: 'cases.title',
    defaultMessage: 'Investigations',
  },
  empty: {
    id: 'cases.empty',
    defaultMessage: 'You do not have any investigations yet.',
  },
  create: {
    id: 'cases.create',
    defaultMessage: 'New investigation',
  },
  placeholder: {
    id: 'cases.placeholder',
    defaultMessage: 'Search investigations...',
  },
  no_results: {
    id: 'cases.no_results',
    defaultMessage: 'No investigations were found matching this query.',
  },
});


export class InvestigationIndexScreen extends Component {
  render() {
    const { query, intl } = this.props;
    return (
      <Screen
        className="InvestigationIndexScreen"
        title={intl.formatMessage(messages.title)}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="case.description"
                defaultMessage="Investigations let you upload and share documents and data which belong to a particular story. You can upload PDFs, email archives or spreadsheets, and they will be made easy to search and browse."
              />
            </p>
            <div className="Dashboard__actions">
              <InvestigationCreateButton
                icon="briefcase"
                text={intl.formatMessage(messages.create)}
              />
            </div>
          </div>
          <CollectionIndex
            query={query}
            icon="briefcase"
            placeholder={intl.formatMessage(messages.placeholder)}
            noResultsText={intl.formatMessage(messages.no_results)}
            emptyText={intl.formatMessage(messages.empty)}
          />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  return { query: investigationsQuery(location) };
};

export default compose(
  withRouter,
  connect(mapStateToProps, {}),
  injectIntl,
)(InvestigationIndexScreen);
