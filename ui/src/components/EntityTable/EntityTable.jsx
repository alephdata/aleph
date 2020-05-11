import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ErrorSection } from 'src/components/common';
import EntityTableEditor from './EntityTableEditor';
import EntityTableViewer from './EntityTableViewer';

class EntityTable extends Component {
  sortColumn(newField) {
    const { query, sort, updateQuery } = this.props;
    const { field: currentField, direction } = sort;

    if (currentField !== newField) {
      return updateQuery(query.sortBy(`properties.${newField}`, 'asc'));
    }

    // Toggle through sorting states: ascending, descending, or unsorted.
    updateQuery(query.sortBy(
      `properties.${currentField}`,
      direction === 'asc' ? 'desc' : undefined
    ));
  }

  render() {
    const { collection, schema, showTableEditor, sort, result, ...rest } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (!result.isPending && result.total === 0 && result.page === 1 && !showTableEditor) {
      return null;
    }

    const TableComponent = showTableEditor ? EntityTableEditor : EntityTableViewer;

    return (
      <TableComponent
        collection={collection}
        onStatusChange={() => {}}
        entities={result.results || []}
        sort={sort}
        isPending={result.isPending}
        sortColumn={this.sortColumn.bind(this)}
        schema={schema}
        {...rest}
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const sort = query.getSort();
  const schema = query.hasFilter('schema') ? query.getFilter('schema')[0] : null;

  return {
    sort: sort ? {
      field: sort.field.replace('properties.', ''),
      direction: sort.direction
    } : undefined,
    schema
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(EntityTable);
