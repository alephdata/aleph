import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { ErrorSection } from 'src/components/common';
import EntityTableEditor from './EntityTableEditor';
import EntityTableViewer from './EntityTableViewer';
import updateStates from 'src/util/updateStates';

class EntityTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      placeholderResult: null,
    };

    this.onStatusChange = this.onStatusChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.result.isPending && !this.props.result.isPending) {
      this.setState({ placeholderResult: null });
    }
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

  onStatusChange(status) {
    // to avoid loading jump, stores previous query result as placeholder during pending update
    if (status === updateStates.IN_PROGRESS) {
      this.setState({ placeholderResult: this.props.result });
    }
  }

  render() {
    const { collection, isEditing, query, result, ...rest } = this.props;
    const { placeholderResult } = this.state;

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
        entities={placeholderResult?.results || results}
        sort={sort}
        isPending={placeholderResult ? placeholderResult.isPending : result.isPending}
        sortColumn={this.sortColumn.bind(this)}
        {...rest}
      />
    )
  }
}

export default withRouter(EntityTable);
