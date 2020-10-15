import React from 'react';
import { Button, MenuDivider, Tabs, Tab } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { Count, Schema, SectionLoading, Skeleton } from 'components/common';
import EntityTable from './EntityTable';
import { selectModel } from 'selectors';

import './EntityTableViews.scss';


class EntityTableViews extends React.PureComponent {
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
    if (result.next && !result.isPending && !result.isError) {
      this.props.queryEntities({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { collection, isEntitySet, query, schema, sort, result, writeable } = this.props;

    return <EntityTable
      entities={result.results}
      collection={collection}
      schema={schema}
      writeable={writeable}
      isPending={result.isPending}
      isEntitySet={isEntitySet}
      getMoreResults={this.getMoreResults}
      isEmpty={result.total === 0}
      sort={sort}
    />;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const sort = query.getSort();

  return {
    sort: !_.isEmpty(sort) ? {
      field: sort.field.replace('properties.', ''),
      direction: sort.direction
    } : {},
    result: selectEntitiesResult(state, query)
  }
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(EntityTableViews);
