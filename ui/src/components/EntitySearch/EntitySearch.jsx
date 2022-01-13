import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import c from 'classnames';

import withRouter from 'app/withRouter'
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import EntitySearchResults from './EntitySearchResults';
import { ErrorSection, QueryInfiniteLoad } from 'components/common';
import { getGroupField } from 'components/SearchField/util';

import './EntitySearch.scss';

const messages = defineMessages({
  no_results_title: {
    id: 'entity.search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'entity.search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
  empty_title: {
    id: 'entity.search.empty_title',
    defaultMessage: 'This folder is empty',
  },
});


export class EntitySearch extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(newQuery) {
    const { updateQuery } = this.props;
    if (updateQuery !== undefined) {
      return updateQuery(newQuery);
    }
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
    return undefined;
  }

  render() {
    const {
      query, result, intl, className, columns,
      showPreview, updateSelection, selection,
      emptyComponent, collection, writeable,
    } = this.props;
    const isEmpty = !query.hasQuery();

    return (
      <div className={c('EntitySearch', className)}>
        {result.total === 0 && (
          <section className="PartialError">
            { !isEmpty && (
              <ErrorSection
                icon="search"
                title={intl.formatMessage(messages.no_results_title)}
                description={intl.formatMessage(messages.no_results_description)}
              />
            )}
            { isEmpty && emptyComponent}
          </section>
        )}
        <EntitySearchResults
          query={query}
          result={result}
          showPreview={showPreview}
          updateQuery={this.updateQuery}
          updateSelection={updateSelection}
          selection={selection}
          collection={collection}
          writeable={writeable}
          columns={[getGroupField('caption'), ...columns]}
        />
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryEntities}
        />
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(EntitySearch);
