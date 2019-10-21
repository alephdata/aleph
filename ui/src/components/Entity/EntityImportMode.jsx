/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { selectCollectionMappings } from 'src/selectors';
import TableViewer from 'src/viewers/TableViewer';
import CSVStreamViewer from 'src/viewers/CsvStreamViewer';
import {
  Column, Table,
} from '@blueprintjs/table';

import './EntityImportMode.scss';

export class EntityImportMode extends Component {
  componentDidMount() {
    this.props.fetchCollectionMappings(this.props.entity.collection.id);
  }

  deleteListing(item) {
    console.log('deleting', item, this);
  }

  renderTableView() {
    const { entity } = this.props;
    if (entity.isLoading || entity.shouldLoad) {
      return null;
    }

    if (!entity.links || !entity.links.csv) {
      return (
        <TableViewer
          document={entity}
        />
      );
    }
    return (
      <CSVStreamViewer
        document={entity}
      />
    );
  }

  renderColumnSelectRow() {
    const { entity } = this.props;

    const columnsJson = entity.getFirst('columns');
    const columns = columnsJson ? JSON.parse(columnsJson) : [];

    return (
      <div className="TableViewer">
        <Table
          numRows={1}
          enableGhostCells
          enableRowHeader
        >
          {columns.map((column, i) => (
            <Column
              key={column}
              id={i}
              name={column}
              cellRenderer={this.renderCell}
            />
          ))}
        </Table>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div>
          {this.renderColumnSelectRow()}
          {this.renderTableView()}
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.entity.collection.id;
  return { mappings: selectCollectionMappings(state, collectionId) };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportMode);
