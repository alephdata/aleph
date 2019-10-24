/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import Papa from 'papaparse';
import JSONPretty from 'react-json-pretty';
import { fetchCollectionMappings, makeMapping } from 'src/actions';
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

    this.setState({ mappings: mappings });
    // model.getSchema()

  }

  async onFormSubmit(event) {
    event.preventDefault();
    const { intl, entity } = this.props;
    try {
      // console.log('mapping is', mapping);
      // const completeMapping = {};
      // completeMapping[entity.collection.foreign_id] = {
      //   queries: [{
      //     csv_url: entity.links.csv.replace(/localhost:8080/, 'api:5000'),
      //     entities: {
      //       a: Object.assign({
      //         schema: importModel.name,
      //       }, mapping),
      //     },
      //   }],
      // };
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
      await this.props.makeMapping(entity.collection.id, test);
      // await this.props.fetchMapping(entity.collection.id);
      console.log('finished');
    } catch (e) {
      console.error(e);
      showErrorToast(intl.formatMessage(messages.error));
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { entity, model, existingMappings } = this.props;
    const { mappings, csvData } = this.state;

    console.log('mappings', mappings);

    console.log('existing mappings are', existingMappings)

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

const mapDispatchToProps = { fetchCollectionMappings, makeMapping };

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
