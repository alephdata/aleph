import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryEntitySets } from 'actions';
import { selectEntitySetsResult } from 'selectors';
import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import { Breadcrumbs } from 'components/common';
import ErrorScreen from 'components/Screen/ErrorScreen';
import EntitySetCreateMenu from 'components/EntitySet/EntitySetCreateMenu';
import DiagramList from 'components/Diagram/DiagramList';


import './DiagramIndexScreen.scss';

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

export class DiagramIndexScreen extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isPending && result.next && !result.isError) {
      this.props.queryEntitySets({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntitySets({ query });
    }
  }

  render() {
    const { intl, result } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    const breadcrumbs = (
      <Breadcrumbs>
        <li>
          <FormattedMessage
            id="diagrams.browser.breadcrumb"
            defaultMessage="Diagrams"
          />
        </li>
      </Breadcrumbs>
    );

    return (
      <Screen
        className="DiagramIndexScreen"
        breadcrumbs={breadcrumbs}
        title={intl.formatMessage(messages.title)}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="diagram.description"
                defaultMessage="Network diagrams let you visualize complex relationships within a dataset."
              />
            </p>
            <div className="Dashboard__actions">
              <EntitySetCreateMenu type='diagram' />
            </div>
          </div>
          <DiagramList
            result={result}
            getMoreItems={this.getMoreResults}
            showCollection
          />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const context = {
    'filter:type': 'diagram'
  };
  const query = Query.fromLocation('entitysets', location, context, 'entitySets')
    .sortBy('updated_at', 'desc');

  const result = selectEntitySetsResult(state, query);

  return {
    query,
    result,
  };
};


export default compose(
  connect(mapStateToProps, { queryEntitySets }),
  injectIntl,
)(DiagramIndexScreen);
