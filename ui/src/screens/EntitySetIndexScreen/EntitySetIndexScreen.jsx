import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { queryEntitySets } from 'actions';
import { selectEntitySetsResult } from 'selectors';
import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import ErrorScreen from 'components/Screen/ErrorScreen';
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
  diagram_description: {
    id: 'diagrams.description',
    defaultMessage: 'Network diagrams let you visualize complex relationships within a dataset.',
  },
  list_description: {
    id: 'lists.description',
    defaultMessage: 'Lists let you organize and group related entities of interest.',
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

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

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
            loadMoreOnScroll
          />
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const type = location.pathname === '/diagrams' ? 'diagram' : 'list';
  const context = {
    'filter:type': type
  };
  let query = Query.fromLocation('entitysets', location, context, 'entitySets');

  if (!query.hasSort()) {
    query = query.sortBy('created_at', 'asc');
  }

  const result = selectEntitySetsResult(state, query);

  return {
    query,
    result,
    type,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntitySets }),
  injectIntl,
)(EntitySetIndexScreen);
