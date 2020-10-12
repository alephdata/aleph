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

  render() {
    const { result, intl, location, query, writeable } = this.props;
    const { hideCollection = false, documentMode = false, showPreview = true } = this.props;
    const { updateSelection, selection } = this.props;
    const { field: sortedField, direction } = query.getSort();

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (!result.isPending && result.total === 0 && result.page === 1) {
      return null;
    }

    const skeletonItems = [...Array(15).keys()];

    const TH = ({
      sortable, field, className, ...otherProps
    }) => {
      return (
        <SortableTH
          sortable={sortable}
          className={className}
          sorted={sortedField === field && (direction === 'desc' ? 'desc' : 'asc')}
          onClick={() => this.sortColumn(field)}
          {...otherProps}
        >
          {intl.formatMessage(messages[`column_${field}`])}
        </SortableTH>
      );
    };
    return (
      <table className="EntitySearchResults data-table">
        <thead>
          <tr>
            {writeable && updateSelection && (<th className="select" />)}
            <TH field="caption" className="wide" sortable />
            {!hideCollection && (
              <TH field="collection_id" className="wide" />
            )}
            {!documentMode && (
              <TH className="header-country" field="countries" sortable />
            )}
            <TH className="header-dates" field="dates" sortable />
            {documentMode && (
              <TH className="header-size" field="properties.fileSize" sortable />
            )}
          </tr>
        </thead>
        <tbody className={c({ updating: result.isPending })}>
          {result.results.map(entity => (
            <EntitySearchResultsRow
              key={entity.id}
              entity={entity}
              location={location}
              hideCollection={hideCollection}
              showPreview={showPreview}
              documentMode={documentMode}
              updateSelection={updateSelection}
              selection={selection}
              writeable={writeable}
            />
          ))}
          {result.isPending && skeletonItems.map(item => (
            <EntitySearchResultsRow
              key={item}
              hideCollection={hideCollection}
              documentMode={documentMode}
              updateSelection={updateSelection}
              writeable={writeable}
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
