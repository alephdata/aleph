/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import Papa from 'papaparse';
import JSONPretty from 'react-json-pretty';
import { fetchCollectionMappings, createCollectionMapping, updateCollectionMapping } from 'src/actions';
import { selectCollectionMappings, selectModel } from 'src/selectors';
import TableViewer from 'src/viewers/TableViewer';
import CSVStreamViewer from 'src/viewers/CsvStreamViewer';
import EntityImportSchemaSelect from './EntityImportSchemaSelect';
import EntityImportMappingChecklist from './EntityImportMappingChecklist';
import EntityImportPropertyAssign from './EntityImportPropertyAssign';
import { Button, Intent } from '@blueprintjs/core';
import { showErrorToast } from 'src/app/toast';


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
      mappings: new Map(),
      csvData: null
    };

    this.onMappingAdd = this.onMappingAdd.bind(this);
    this.onMappingRemove = this.onMappingRemove.bind(this);
    this.onKeyAssign = this.onKeyAssign.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onPropertyAssign = this.onPropertyAssign.bind(this);
  }
  componentDidMount() {
    this.fetchCsvData();
    this.props.fetchCollectionMappings(this.props.entity.collection.id);
  }

  componentDidUpdate(prevProps) {
    const { existingMappings } = this.props;
    if (existingMappings && existingMappings.length && !existingMappings.isLoading && !existingMappings.isError &&
      prevProps.existingMappings !== existingMappings) {
        console.log('LOADING FROM EXISTING MAPPING', existingMappings.length);
        this.loadFromMapping(existingMappings[0]);
    }
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

  onMappingAdd(schema) {
    const { mappings } = this.state;
    const clone = new Map(mappings);
    const id = schema.name;

    const newMapping = {
      id,
      schema,
      keys: [],
      properties: {}
    };
    clone.set(id, newMapping);

    this.setState(({ mappings }) => ({ mappings: clone }));
  }

  onMappingRemove(item) {
    console.log('in on mapping remove');
  }

  onKeyAssign(mappingId, key) {
    this.updateMappings(mappingId, mappingObj => mappingObj.keys.push(key))
  }

  onKeyRemove(mappingId, key) {
    this.updateMappings(mappingId, mappingObj => {
      const index = mappingObj.keys.indexOf(key);
      if (index !== -1) {
        mappingObj.keys.splice(index, 1);
      }
    })
  }

  onPropertyAssign(mappingId, propName, value) {
    this.updateMappings(mappingId, mappingObj => mappingObj.properties[propName] = value)
  }

  updateMappings(mappingId, updateToApply) {
    console.log('updating', mappingId);
    const { mappings } = this.state;
    const clone = new Map(mappings);

    const newMappingObj = clone.get(mappingId);
    if (newMappingObj) {
      updateToApply(newMappingObj);
      this.setState(({ mappings }) => ({ mappings: clone }));
    }
  }

  convertToJSON() {
    const { mappings, csvData } = this.state;
    const toJSON = {};

    mappings.forEach(({id, schema, keys, properties}) => {
      toJSON[id] = {
        schema: schema.name,
        keys,
        properties
      };
    });

    return toJSON;
  }

  // const schemaObject = {
  //   schema,
  //   keys: [],
  //   source: null,
  //   target: null,
  // };

  loadFromMapping(existingMapping) {
    const { model } = this.props;

    const mappings = new Map();

    Object.values(existingMapping.query).forEach(({keys, schema, properties}) => {
      mappings.set(schema, {
        id: schema,
        schema: model.getSchema(schema),
        keys,
        properties,
      })
    });

    this.setState({ existingMappingId: existingMapping.id, mappings: mappings });
  }

  async onFormSubmit(event) {
    event.preventDefault();
    const { createCollectionMapping, entity, updateCollectionMapping } = this.props;
    console.log(entity);
    const { existingMappingId, mapping } = this.state;

    try {
      const fullMapping = {
        table_id: entity.id,
        mapping_query: this.convertToJSON(mapping),
      };
      // const test = {
      //   table_id: '5',
      //   mapping_query: {
      //     person: {
      //       schema: 'Person',
      //       keys: [
      //         'name',
      //       ],
      //       properties: {
      //         name: {
      //           column: 'name',
      //         },
      //       },
      //     },
      //   },
      // };
      if (existingMappingId) {
        await updateCollectionMapping(entity.collection.id, existingMappingId, fullMapping);
      } else {
        await createCollectionMapping(entity.collection.id, fullMapping);
      }

      console.log('finished');
    } catch (e) {
      console.error(e);
      showErrorToast(e);
    }
  }

  render() {
    const { entity, model, existingMappings } = this.props;
    const { mappings, csvData } = this.state;

    console.log('mappings', mappings);
    console.log('existing mappings are', existingMappings)

    const existingMapping = existingMappings.length && !existingMappings.isLoading && !existingMappings.isError ? existingMappings[0] : null

    // console.log('csv data is', csvData);
    let columns, columnLabels, fullMapping;
    if (csvData) {
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
        {existingMapping && (
          <div>
            <span>Created at</span>
            <span>{existingMapping.created_at}</span>
            <span>Last updated</span>
            <span>{existingMapping.updated_at}</span>
            <span>Running status</span>
            <span>{existingMapping.last_run_status}</span>
          </div>
        )}
        <h6 className="bp3-heading">
          1. Select Entity Types to Map
        </h6>
        <EntityImportSchemaSelect
          model={model}
          mappings={mappings}
          onSelect={this.onMappingAdd}
        />
        {mappings.size > 0 && (
          <React.Fragment>
            <div className="EntityImport__section">
              <h6 className="bp3-heading">
                2. Edit basic info for each entity
              </h6>
              <EntityImportMappingChecklist
                columnLabels={columnLabels}
                mappings={mappings}
                onKeyAssign={this.onKeyAssign}
                onKeyRemove={this.onKeyRemove}
                onPropertyAssign={this.onPropertyAssign}
              />
            </div>
            {csvData && (
              <div className="EntityImport__section">
                <h6 className="bp3-heading">
                  3. Map columns to properties
                </h6>
                <EntityImportPropertyAssign
                  csvData={csvData}
                  mappings={mappings}
                  onPropertyAssign={this.onPropertyAssign}
                />
              </div>
            )}
            <div className="EntityImport__section">
              <h6 className="bp3-heading">
                4. Verify
              </h6>

              <JSONPretty id="json-pretty" data={this.convertToJSON(mappings)} />
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

const mapDispatchToProps = { fetchCollectionMappings, createCollectionMapping, updateCollectionMapping };

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.entity.collection.id;
  return {
    model: selectModel(state),
    existingMappings: selectCollectionMappings(state, collectionId)
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportMode);
