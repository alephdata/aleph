/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import Papa from 'papaparse';
import JSONPretty from 'react-json-pretty';
import { fetchCollectionMappings } from 'src/actions';
import { selectCollectionMappings, selectModel } from 'src/selectors';
import TableViewer from 'src/viewers/TableViewer';
import CSVStreamViewer from 'src/viewers/CsvStreamViewer';
import EntityImportSchemaSelect from './EntityImportSchemaSelect';
import EntityImportMappingChecklist from './EntityImportMappingChecklist';
import EntityImportPropertyAssign from './EntityImportPropertyAssign';
import { Button, Intent } from '@blueprintjs/core';

import {
  Column, Table,
} from '@blueprintjs/table';

import './EntityImportMode.scss';

const test = {
  table_id: '5',
  mapping_query: {
    person: {
      schema: 'Person',
      keys: [
        'name',
        'nationality',
      ],
      properties: {
        name: {
          column: 'name',
        },
        nationality: {
          column: 'nationality',
        },
      },
    },
  },
};

// {
//   schema:
//   keys: []
//   properties: {
//     name: {
//       column: 'name',
//     },
//     nationality: {
//       column: 'nationality',
//     },
//   },
// }

// [
//   0:
//     {
//       schema:
//       property:
//     },
//   1:
//     {
//
//     }
// ]



export class EntityImportMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedSchemata: new Map(),
      columnMappings: [],
      csvData: null
    };

    this.onSchemaAdd = this.onSchemaAdd.bind(this);
    this.onSchemaRemove = this.onSchemaRemove.bind(this);
    this.onKeyAssign = this.onKeyAssign.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onEdgeAssign = this.onEdgeAssign.bind(this);

    this.onPropertyAssign = this.onPropertyAssign.bind(this);
  }
  componentDidMount() {
    this.fetchCsvData();
    this.props.fetchCollectionMappings(this.props.entity.collection.id);
  }

  fetchCsvData() {
    const { entity } = this.props;
    const url = entity.links.csv;
    // set chunk size to 100 KB
    Papa.RemoteChunkSize = 1024 * 100;
    Papa.parse(url, {
      download: true,
      delimiter: ',',
      newline: '\n',
      encoding: 'utf-8',
      chunk: (results, parser) => {
        this.setState({
          csvData: results.data.slice(0, 10),
        });
        parser.abort();
      },
    });
  }

  deleteListing(item) {
    console.log('deleting', item, this);
  }

  onSchemaAdd(schema) {
    const { selectedSchemata } = this.state;
    const newSchemaList = new Map(selectedSchemata);
    const schemaObject = {
      schema,
      keys: [],
      source: null,
      target: null,
    };
    newSchemaList.set(schema.name, schemaObject)

    this.setState(({ selectedSchemata }) => ({ selectedSchemata: newSchemaList }));
  }

  onSchemaRemove(item) {
    console.log('in on schema remove');
  }

  onKeyAssign(schema, item) {
    this.updateSelectedSchemata(schema, schemaObj => schemaObj.keys.push(item))
  }

  onKeyRemove(schema, item) {
    this.updateSelectedSchemata(schema, schemaObj => {
      const index = schemaObj.keys.indexOf(item);
      if (index !== -1) {
        schemaObj.keys.splice(index, 1);
      }
    })
  }

  onEdgeAssign(schema, sourceOrTarget, entityToAssign) {
    console.log('in edge assign', entityToAssign);
    this.updateSelectedSchemata(schema, schemaObj => schemaObj[sourceOrTarget] = entityToAssign)
  }

  updateSelectedSchemata(schema, updateToApply) {
    const { selectedSchemata } = this.state;
    const newSchemaObj = selectedSchemata.get(schema.name);

    updateToApply(newSchemaObj);

    const newSchemaList = new Map(selectedSchemata);
    newSchemaList.set(schema.name, newSchemaObj)
    this.setState(({ selectedSchemata }) => ({ selectedSchemata: newSchemaList }));
  }

  onPropertyAssign(item, column) {
    console.log('assigning', item, column);
    const { columnMappings } = this.state;

    const newColumnMappings = [...columnMappings]
    newColumnMappings[column] = item
    this.setState(({ columnMappings }) => ({ columnMappings: newColumnMappings }));
  }

  // mapping_query: {
  //   person: {
  //     schema: 'Person',
  //     keys: [
  //       'name',
  //       'nationality',
  //     ],
  //     properties: {
  //       name: {
  //         column: 'name',
  //       },
  //       nationality: {
  //         column: 'nationality',
  //       },
  //     },
  //   },
  // },

  // [
  //   0:
  //     {
  //       schema:
  //       property:
  //     },
  //   1:
  //     {
  //
  //     }
  // ]

  convertToMapping() {
    const { columnMappings, selectedSchemata, csvData } = this.state;
    const mapping = {};
    const columnNames = csvData[0];

    selectedSchemata.forEach(({schema, keys, source, target}, schemaName) => {
      const properties = {};

      if (source) {
        properties[schema.edge.source] = source
      }
      if (target) {
        properties[schema.edge.target] = target
      }
      mapping[schema.name] = {
        schema: schemaName,
        keys,
        properties
      };
    });

    columnMappings.forEach((column, i) => {
      if (column) {
        const {schema, property} = column;
        const columnName = columnNames[i];
        mapping[schema].properties[property.name] = { column: columnName };
      }
    })

    return mapping;
  }

  convertFromMapping(mapping) {

    Object.entries(mapping)
  }

  onFormSubmit() {
    console.log('in on form submit');
  }

  render() {
    const { entity, model } = this.props;
    const { selectedSchemata, columnMappings, csvData } = this.state;

    console.log('selectedSchemata, columnMappings', selectedSchemata, columnMappings);

    // console.log('csv data is', csvData);
    let columns, columnLabels, fullMapping;
    if (csvData) {
      fullMapping = this.convertToMapping();
      const columnsJson = entity.getFirst('columns');
      columns = columnsJson ? JSON.parse(columnsJson) : [];
      columnLabels = columns.map((column, index) => {
        let label = column;
        let alternateLabel = null;
        if (csvData[0] && csvData[0][index]) {
          alternateLabel = label;
          label = csvData[0][index];
        }
        return label
      });
    }

    return (
      <div>
        <h6 className="bp3-heading">
          1. Select Entity Types to Map
        </h6>
        <EntityImportSchemaSelect
          model={model}
          selectedSchemata={selectedSchemata}
          onSelect={this.onSchemaAdd}
        />
        {selectedSchemata.size > 0 && (
          <React.Fragment>
            <div className="EntityImport__section">
              <h6 className="bp3-heading">
                2. Edit basic info for each entity
              </h6>
              <EntityImportMappingChecklist
                columnLabels={columnLabels}
                columnMappings={columnMappings}
                selectedSchemata={selectedSchemata}
                onKeyAssign={this.onKeyAssign}
                onKeyRemove={this.onKeyRemove}
                onEdgeAssign={this.onEdgeAssign}
              />
            </div>
            {csvData && (
              <div className="EntityImport__section">
                <h6 className="bp3-heading">
                  3. Map columns to properties
                </h6>
                <EntityImportPropertyAssign
                  csvData={csvData}
                  columnMappings={columnMappings}
                  selectedSchemata={selectedSchemata}
                  onPropertyAssign={this.onPropertyAssign}
                />
              </div>
            )}
            <div className="EntityImport__section">
              <h6 className="bp3-heading">
                4. Verify
              </h6>

              <JSONPretty id="json-pretty" data={fullMapping} />
            </div>
            <div className="EntityImport__section">
              <Button
                type="submit"
                disabled={false}
                intent={Intent.PRIMARY}
                text="Import"
                onClick={e => this.onFormSubmit(e)}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.entity.collection.id;
  return {
    model: selectModel(state),
    mappings: selectCollectionMappings(state, collectionId)
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportMode);
