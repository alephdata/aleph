import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { ErrorSection } from 'src/components/common';
import EntityTableEditor from './EntityTableEditor';
import EntityTableViewer from './EntityTableViewer';

class EntityTable extends Component {
  sortColumn(newField) {
    const { query, updateQuery } = this.props;
    const { field: currentField, direction } = query.getSort();

    console.log('new field is', newField);
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

  onStatusChange() {
    console.log('on status change');
  }

  render() {
    const { collection, isEditing, query, result, ...rest } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (!result.isPending && result.total === 0 && result.page === 1 && !isEditing) {
      return null;
    }

    const results = result.results ? result.results.filter((e) => e.id !== undefined) : [];
    const sort = query.getSort();
    const TableComponent = isEditing ? EntityTableEditor : EntityTableViewer;

    return (
      <TableComponent
        collection={collection}
        onStatusChange={this.onStatusChange}
        entities={results}
        sort={sort}
        isPending={result.isPending}
        sortColumn={this.sortColumn.bind(this)}
        {...rest}
      />
    )
  }
}

export default withRouter(EntityTable);
