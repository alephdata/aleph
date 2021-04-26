import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';
import queryString from 'query-string';

import { DualPane } from 'components/common';
import SearchFacets from 'components/Facet/SearchFacets';
import SearchActionBar from 'components/common/SearchActionBar';
import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import TimelineActionBar from 'components/Timeline/TimelineActionBar';
import TimelineItemList from 'components/Timeline/TimelineItemList';
import DateFacet from 'components/Facet/DateFacet';
import QueryTags from 'components/QueryTags/QueryTags';
import SortingBar from 'components/SortingBar/SortingBar';
import { selectEntitiesResult } from 'selectors';

import './Timeline.scss';

const defaultFacets = [
  'names', 'addresses', 'schema',
];

const messages = defineMessages({
  histogramEmpty: {
    id: 'timeline.empty_histogram',
    defaultMessage: 'No dates found',
  },
  itemsLabel: {
    id: 'timeline.items_label',
    defaultMessage: 'items',
  },
  resultText: {
    id: 'timeline.result_text',
    defaultMessage: '{count} timeline items',
  },
  resultTextQuery: {
    id: 'timeline.result_text_query',
    defaultMessage: 'Showing {count} (of {total} total) items',
  }
});

class Timeline extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDraftItem: false,
      histogramFixed: false
    };
    this.onScroll = this.onScroll.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.histogramRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll() {
    const { histogramFixed } = this.state;
    const histTop = this.histogramRef.current.offsetTop;
    const isOffScreen = window.pageYOffset > histTop;

    if (!histogramFixed && isOffScreen) {
      this.setState({ histogramFixed: true })
    } else if (histogramFixed && !isOffScreen) {
      this.setState({ histogramFixed: false })
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash
    });
  }

  render() {
    const { expandedMode, entitiesCount, entityManager, query, intl, result, timeline } = this.props;
    const { histogramFixed, showDraftItem } = this.state;

    const actionBar = timeline.writeable && (
      <TimelineActionBar
        disabled={showDraftItem}
        expandedMode={expandedMode}
        createNewItem={() => this.setState({ showDraftItem: true })}
        buttonGroupProps={{ fill: histogramFixed }}
      />
    );

    return (
      <DualPane className="Timeline theme-light">
        <DualPane.SidePane>
          <div className={c("Timeline__date-container", { fixed: histogramFixed })}>
            <DateFacet
              isOpen={true}
              intervals={result.facets?.dates?.intervals}
              query={query}
              updateQuery={this.updateQuery}
              dataLabel={intl.formatMessage(messages.itemsLabel)}
              emptyText={intl.formatMessage(messages.histogramEmpty)}
            />
            {histogramFixed && actionBar}
          </div>
          <SearchFacets
            query={query}
            result={result}
            updateQuery={this.updateQuery}
            facets={defaultFacets}
          />
          <div className="Timeline__date-placeholder" ref={this.histogramRef}></div>
        </DualPane.SidePane>
        <DualPane.ContentPane>
          <QueryTags query={query} updateQuery={this.updateQuery} />
          <SearchActionBar
            result={result}
            customResultText={
              result.total === entitiesCount.total
                ? intl.formatMessage(messages.resultText, { count: result.total })
                : intl.formatMessage(messages.resultTextQuery, { count: result.total, total: entitiesCount.total })
            }
          >
            <SortingBar
              query={query}
              updateQuery={this.updateQuery}
              sortingFields={['properties.date', 'properties.endDate', 'caption', 'created_at']}
            />
          </SearchActionBar>
          {actionBar}
          <TimelineItemList
            query={query}
            result={result}
            entitiesCount={entitiesCount}
            showDraftItem={showDraftItem}
            onHideDraft={() => this.setState({ showDraftItem: false })}
            entityManager={entityManager}
            expandedMode={expandedMode}
            timeline={timeline}
          />
        </DualPane.ContentPane>
      </DualPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query, location } = ownProps;
  const parsedHash = queryString.parse(location.hash);

  return {
    expandedMode: parsedHash.expanded === 'true',
    result: selectEntitiesResult(state, query)
  };
};

export default compose(
  withRouter,
  entityEditorWrapper,
  connect(mapStateToProps),
  injectIntl,
)(Timeline);
