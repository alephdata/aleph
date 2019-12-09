import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';
import { SectionLoading, ErrorSection } from 'src/components/common';
import { queryDiagrams } from 'src/actions';
import { selectDiagramsResult } from 'src/selectors';
import DiagramListItem from 'src/components/Diagram/DiagramListItem';

// import './DiagramList.scss';


const messages = defineMessages({
  no_notifications: {
    id: 'notifications.no_notifications',
    defaultMessage: 'You have no unseen notifications',
  },
});


class DiagramList extends Component {
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
    const { result, intl } = this.props;

    return (
      <>
        { result.total === 0 && (
          <ErrorSection
            icon="notifications"
            title={intl.formatMessage(messages.no_notifications)}
          />
        )}
        { result.total !== 0 && (
          <ul className="results">
            {result.results.map(diagram => <DiagramListItem key={diagram.id} diagram={diagram} />)}
          </ul>
        )}
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        { result.isLoading && (
          <SectionLoading />
        )}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectDiagramsResult(state, query);
  return { query, result };
};
const mapDispatchToProps = { queryDiagrams };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(DiagramList);
