import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryDiagrams } from 'src/actions';
import { selectDiagramsResult } from 'src/selectors';
import Query from 'src/app/Query';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import {
  Breadcrumbs, SectionLoading,
} from 'src/components/common';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import DiagramCreateMenu from 'src/components/Diagram/DiagramCreateMenu';
import DiagramList from 'src/components/Diagram/DiagramList';


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

  componentDidUpdate(prevProps) {
    const { result } = this.props;

    if (result.shouldLoad && !prevProps.result.shouldLoad) {
      this.fetchIfNeeded();
    }
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryDiagrams({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading) {
      this.props.queryDiagrams({ query });
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
              <DiagramCreateMenu />
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
  const query = Query.fromLocation('diagrams', location, {}, 'diagrams')
    .sortBy('updated_at', 'desc');

  const result = selectDiagramsResult(state, query);

  return {
    query,
    result,
  };
};


export default compose(
  connect(mapStateToProps, { queryDiagrams }),
  injectIntl,
)(DiagramIndexScreen);
