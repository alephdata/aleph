import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import { compose } from 'redux';
import { withRouter } from 'react-router';
import { SortableTH, ErrorSection } from 'src/components/common';
import EntityTableRow from './EntityTableRow';
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
  constructor(props) {
    super(props);
    this.state = {
      result: props.result,
    };
  }

  static getDerivedStateFromProps(nextProps) {
    const { result } = nextProps;
    return (!result.isLoading) ? { result } : null;
  }

  sortColumn(newField) {
    const { query, updateQuery } = this.props;
    const { field: currentField, direction } = query.getSort();
    // Toggle through sorting states: ascending, descending, or unsorted.
    if (currentField !== newField) {
      return updateQuery(query.sortBy(newField, 'asc'));
    }
    if (direction === 'asc') {
      updateQuery(query.sortBy(currentField, 'desc'));
    } else {
      updateQuery(query.sortBy(currentField, undefined));
    }
    return undefined;
  }

  render() {
    const { query, intl, location } = this.props;
    const { hideCollection = false, documentMode = false, showPreview = true } = this.props;
    const { updateSelection, selection } = this.props;
    const isLoading = this.props.result.total === undefined;
    const { result } = this.state;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (result.total === 0 && result.page === 1) {
      return null;
    }

    const TH = ({
      sortable, field, className, ...otherProps
    }) => {
      const { field: sortedField, direction } = query.getSort();
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
        <tbody className={c({ updating: isLoading })}>
          {result.results !== undefined && result.results.map(entity => (
            <EntityTableRow
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
        </tbody>
      </table>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(EntityTable);
