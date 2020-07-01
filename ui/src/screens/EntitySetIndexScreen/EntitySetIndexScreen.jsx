import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { queryEntitySets } from 'src/actions';
import { selectEntitySetsResult } from 'src/selectors';
import Query from 'src/app/Query';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import { Breadcrumbs } from 'src/components/common';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import EntitySetCreateMenu from 'src/components/EntitySet/EntitySetCreateMenu';
import EntitySetList from 'src/components/EntitySet/EntitySetList';


import './EntitySetIndexScreen.scss';

const messages = defineMessages({
  breadcrumb: {
    id: 'entitysets.browser.breadcrumb',
    defaultMessage: '{type}s',
  },
  title: {
    id: 'entitysets.title',
    defaultMessage: 'Sets',
  },
  title_diagrams: {
    id: 'entitysets.title_diagrams',
    defaultMessage: 'Network diagrams',
  },
  title_timelines: {
    id: 'entitysets.title_timelines',
    defaultMessage: 'Timelines',
  },
  description: {
    id: 'entitysets.description',
    defaultMessage: 'Sets let you group Entities within a dataset together for contextualized analysis.',
  },
  description_diagrams: {
    id: 'entitysets.description_diagrams',
    defaultMessage: 'Network diagrams let you visualize complex relationships within a dataset.',
  },
  description_timelines: {
    id: 'entitysets.description_timelines',
    defaultMessage: 'Timelines let you arrange events within a dataset for viszalization further analysis.',
  },
  no_results_title: {
    id: 'entitysets.no_results_title',
    defaultMessage: 'You do not have any {type}s yet',
  },
});

const CONCRETE_TYPES = ['diagram', 'timeline'];

export class EntitySetIndexScreen extends Component {
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
    const { intl, result, type } = this.props;

    if (result.isError) {
      return <ErrorScreen error={result.error} />;
    }

    const msg = (id, type) => messages[CONCRETE_TYPES.includes(type) ? `${id}_${type}s` : id];

    const breadcrumbs = (
      <Breadcrumbs>
        <li>{intl.formatMessage(messages.breadcrumb, { type })}</li>
      </Breadcrumbs>
    );


    return (
      <Screen
        className="EntitySetIndexScreen"
        breadcrumbs={breadcrumbs}
        title={intl.formatMessage(msg('title', type), { type })}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{intl.formatMessage(msg('title', type), { type })}</h5>
            <p className="Dashboard__subheading">
              {intl.formatMessage(msg('description', type), { type })}
            </p>
            <div className="Dashboard__actions">
              <EntitySetCreateMenu type={ type } />
            </div>
          </div>
          <EntitySetList
            type={type}
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

  // FIXME
  let query = Query.fromLocation('entitysets', location, {}, 'entitySets')
    .sortBy('updated_at', 'desc');
  const type = query.state['filter:type'];
  if (type) {
    query = query.setFilter('type', type);
  }

  const result = selectEntitySetsResult(state, query);

  return {
    type,
    query,
    result,
  };
};


export default compose(
  connect(mapStateToProps, { queryEntitySets }),
  injectIntl,
)(EntitySetIndexScreen);
