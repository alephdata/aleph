import React, {Component} from 'react';
import Waypoint from 'react-waypoint';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import {defineMessages, injectIntl} from 'react-intl';

import Query from 'src/app/Query';
import {queryEntities} from 'src/actions';
import {selectEntitiesResult} from 'src/selectors';
import EntityTable from 'src/components/EntityTable/EntityTable';
import SectionLoading from 'src/components/common/SectionLoading';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';

const messages = defineMessages({
  no_results_title: {
    id: 'search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
});

class EntitySearch extends Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    // Check for a change of query, as unconditionally calling fetchIfNeeded
    // could cause an infinite loop (if fetching fails).
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const {query, result, queryEntities} = this.props;
    if ((result.pages === undefined || (result.status === 'error'))) {
      queryEntities({query: query});
    }
  }

  getMoreResults() {
    const {query, result, queryEntities} = this.props;
    if (result && result.next) {
      queryEntities({query, next: result.next});
    }
  }

  updateQuery(newQuery) {
    if (this.props.updateQuery !== undefined) {
      return this.props.updateQuery(newQuery);
    }
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  render() {
    const {query, result, showLinksInPreview} = this.props;
    return (
      <React.Fragment>
        {result.total === 0 &&
        <section className="PartialError">
          <ErrorScreen.PageNotFound visual='search' title={messages.no_results_title}
                                    description={messages.no_results_description}/>
        </section>
        }
        <EntityTable query={query}
                     documentMode={this.props.documentMode}
                     hideCollection={this.props.hideCollection}
                     updateQuery={this.updateQuery}
                     result={result}
                     showLinksInPreview={showLinksInPreview}/>
        {!result.isLoading && result.next && (
          <Waypoint
            onEnter={this.getMoreResults}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        {result.isLoading && (
          <SectionLoading/>
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location, context, prefix, query} = ownProps;

  // We normally only want Things, not Intervals (relations between things).
  const contextWithDefaults = {
    'filter:schemata': context['filter:schemata'] || 'Thing',
    'limit': 50,
    ...context,
  };
  const searchQuery = query !== undefined ? query : Query.fromLocation('search', location, contextWithDefaults, prefix);
  const result = selectEntitiesResult(state, searchQuery);

  return {
    query: searchQuery,
    result,
  };
};

EntitySearch = connect(mapStateToProps, {queryEntities})(EntitySearch);
EntitySearch = withRouter(EntitySearch);
EntitySearch = injectIntl(EntitySearch);

EntitySearch.propTypes = {
  context: PropTypes.object,
  documentMode: PropTypes.bool,
  hideCollection: PropTypes.bool,
  prefix: PropTypes.string,
};

EntitySearch.defaultProps = {
  context: {},
  documentMode: false,
  hideCollection: false,
  prefix: '',
};

export default EntitySearch;
