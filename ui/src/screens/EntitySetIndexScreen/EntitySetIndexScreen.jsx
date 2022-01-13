import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { queryEntitySets } from 'actions';
import { selectEntitySetsResult } from 'selectors';
import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import EntitySetCreateMenu from 'components/EntitySet/EntitySetCreateMenu';
import EntitySetIndex from 'components/EntitySet/EntitySetIndex';


const messages = defineMessages({
  diagram_title: {
    id: 'diagrams.title',
    defaultMessage: 'Network diagrams',
  },
  list_title: {
    id: 'lists.title',
    defaultMessage: 'Lists',
  },
  timeline_title: {
    id: 'timelines.title',
    defaultMessage: 'Timelines',
  },
  diagram_description: {
    id: 'diagrams.description',
    defaultMessage: 'Network diagrams let you visualize complex relationships within an investigation.',
  },
  list_description: {
    id: 'lists.description',
    defaultMessage: 'Lists let you organize and group related entities of interest.',
  },
  timeline_description: {
    id: 'timelines.description',
    defaultMessage: 'Timelines are a way to view and organize events chronologically.',
  },
});

export class EntitySetIndexScreen extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntitySets({ query });
    }
  }

  render() {
    const { intl, query, result, type } = this.props;
    const title = intl.formatMessage(messages[`${type}_title`])
    const description = intl.formatMessage(messages[`${type}_description`])

    return (
      <Screen
        className="EntitySetIndexScreen"
        title={title}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{title}</h5>
            <p className="Dashboard__subheading">{description}</p>
            <div className="Dashboard__actions">
              <EntitySetCreateMenu type={type} />
            </div>
          </div>
          <EntitySetIndex
            result={result}
            type={type}
            query={query}
            showCollection
          />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  let type;
  if (location.pathname === '/diagrams') {
    type = 'diagram';
  } else if (location.pathname === '/timelines') {
    type = 'timeline';
  } else {
    type = 'list';
  }
  const context = {
    'filter:type': type
  };
  let query = Query.fromLocation('entitysets', location, context, 'entitySets')
    .defaultSortBy('created_at', 'asc');
  return {
    query,
    result: selectEntitySetsResult(state, query),
    type,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntitySets }),
  injectIntl,
)(EntitySetIndexScreen);
