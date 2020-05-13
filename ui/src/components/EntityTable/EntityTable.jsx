import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import { SortableTH } from 'src/components/common';
import EntityTableViewerRow from './EntityTableViewerRow';
import { ErrorSection } from 'src/components/common';

import './EntityTable.scss';

const messages = defineMessages({
  column_name: {
    id: 'entity.column.name',
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


class EntityTable extends Component {
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
    const { result, intl, location, query } = this.props;
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
      <table className="EntityTable data-table">
        <thead>
          <tr>
            {updateSelection && (<th className="select" />)}
            <TH field="name" className="wide" sortable />
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
            <EntityTableViewerRow
              key={entity.id}
              entity={entity}
              location={location}
              hideCollection={hideCollection}
              showPreview={showPreview}
              documentMode={documentMode}
              updateSelection={updateSelection}
              selection={selection}
            />
          ))}
          {result.isPending && skeletonItems.map(item => (
            <EntityTableViewerRow
              key={item}
              hideCollection={hideCollection}
              documentMode={documentMode}
              updateSelection={updateSelection}
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
)(EntityTable);
