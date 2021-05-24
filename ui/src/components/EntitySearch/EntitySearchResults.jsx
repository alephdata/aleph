import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { SortableTH } from 'components/common';
import EntitySearchResultsRow from './EntitySearchResultsRow';
import { ErrorSection } from 'components/common';

import './EntitySearchResults.scss';

const messages = defineMessages({
  column_caption: {
    id: 'entity.column.caption',
    defaultMessage: 'Name',
  },
  column_collection_id: {
    id: 'entity.column.collection_id',
    defaultMessage: 'Dataset',
  },
  column_schema: {
    id: 'entity.column.schema',
    defaultMessage: 'Type',
  },
  column_countries: {
    id: 'entity.column.countries',
    defaultMessage: 'Countries',
  },
  'column_properties.fileSize': {
    id: 'entity.column.file_size',
    defaultMessage: 'Size',
  },
  column_dates: {
    id: 'entity.column.dates',
    defaultMessage: 'Date',
  },
});


class EntitySearchResults extends Component {
  sortColumn(newField) {
    const { query, updateQuery } = this.props;
    const { field: currentField, direction } = query.getSort();

    if (currentField !== newField) {
      return updateQuery(query.sortBy(newField, 'asc'));
    }

    // Toggle through sorting states: ascending, descending, or unsorted.
    updateQuery(query.sortBy(
      currentField,
      direction === 'asc' ? 'desc' : undefined
    ));
  }

  renderHeaderCell = (field) => {
    const { intl, query } = this.props;
    const { field: sortedField, direction } = query.getSort();
    return (
      <SortableTH
        key={field}
        sortable={field !== 'collection_id'}
        className={c({ wide: field === 'caption' || field === 'collection_id' })}
        sorted={sortedField === field && (direction === 'desc' ? 'desc' : 'asc')}
        onClick={() => this.sortColumn(field)}
      >
        {intl.formatMessage(messages[`column_${field}`])}
      </SortableTH>
    );
  }

  render() {
    const { defaultColumns, result, intl, location, query, writeable } = this.props;
    const { showPreview = true } = this.props;
    const { updateSelection, selection } = this.props;
    const { field: sortedField, direction } = query.getSort();

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (!result.isPending && result.total === 0 && result.page === 1) {
      return null;
    }

    const skeletonItems = [...Array(15).keys()];

    return (
      <table className="EntitySearchResults data-table">
        <thead>
          <tr>
            {writeable && updateSelection && (<th className="select" />)}
            {defaultColumns.map(this.renderHeaderCell)}
          </tr>
        </thead>
        <tbody className={c({ updating: result.isPending })}>
          {result.results.map(entity => (
            <EntitySearchResultsRow
              key={entity.id}
              entity={entity}
              location={location}
              showPreview={showPreview}
              updateSelection={updateSelection}
              selection={selection}
              writeable={writeable}
              defaultColumns={defaultColumns}
            />
          ))}
          {result.isPending && skeletonItems.map(item => (
            <EntitySearchResultsRow
              key={item}
              updateSelection={updateSelection}
              writeable={writeable}
              defaultColumns={defaultColumns}
              isPending
            />
          ))}
        </tbody>
      </table>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(EntitySearchResults);
