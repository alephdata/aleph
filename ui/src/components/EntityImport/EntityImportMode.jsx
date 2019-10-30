/* eslint-disable */

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import Papa from 'papaparse';
import { showErrorToast } from 'src/app/toast';
import { fetchCollectionMappings } from 'src/actions';
import { selectCollectionMappings, selectModel } from 'src/selectors';
import TableViewer from 'src/viewers/TableViewer';
import CSVStreamViewer from 'src/viewers/CsvStreamViewer';
import MappingStatus from './MappingStatus';
import MappingSelect from './MappingSelect';
import MappingList from './MappingList';
import MappingVerify from './MappingVerify';

import EntityImportPropertyAssign from './EntityImportPropertyAssign';
import EntityImportManageMenu from './EntityImportManageMenu';
import {
  Date, Entity,
} from 'src/components/common';

import { Button, Colors, Intent } from '@blueprintjs/core';
import {
  Column, Table,
} from '@blueprintjs/table';


import './EntityImportMode.scss';

const colorOptions = [
  Colors.BLUE1, Colors.GREEN1, Colors.ORANGE1, Colors.RED1, Colors.VIOLET1, Colors.TURQUOISE1
];

export class EntityImportMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mappings: new Map(),
      csvData: null,
      validationError: null,
    };

    this.onMappingAdd = this.onMappingAdd.bind(this);
    this.onMappingRemove = this.onMappingRemove.bind(this);
    this.onKeyAssign = this.onKeyAssign.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onPropertyAssign = this.onPropertyAssign.bind(this);
    this.onValidate = this.onValidate.bind(this);
  }

  componentDidMount() {
    this.fetchCsvData();
    this.props.fetchCollectionMappings(this.props.entity.collection.id);
  }

  componentDidUpdate(prevProps) {
    console.log('updating!!!!');
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
        console.log(results.data[0], results.data.slice(0, 1));
        this.setState({
          csvHeader: results.data[0],
          csvData: results.data.slice(1, 15),
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
    const index = mappings.size;

    const newMapping = {
      id,
      color: colorOptions[index%colorOptions.length],
      schema,
      keys: [],
      properties: {}
    };
    clone.set(id, newMapping);

    this.setState(({ mappings }) => ({ mappings: clone }));
  }

  onMappingRemove(schema) {
    const { mappings } = this.state;
    const clone = new Map(mappings);
    clone.delete(schema.name)

    this.setState(({ mappings }) => ({ mappings: clone }));
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
    const { mappings } = this.state;
    const clone = new Map(mappings);

    const newMappingObj = clone.get(mappingId);
    if (newMappingObj) {
      updateToApply(newMappingObj);
      this.setState(({ mappings }) => ({ mappings: clone }));
    }
  }

  onValidate() {
    console.log('validating');
    const { mappings } = this.state;
    const errors = [];
    let isValid = true

    mappings.forEach(({ id, keys, properties, schema}) => {
      if (keys.length === 0) {
        errors.push(`Key Error: ${id} entity must have at least one key`);
        isValid = false;
      }
      if (schema.isEdge) {
        const { source, target } = schema.edge;

        if (!properties.hasOwnProperty(source)) {
          errors.push(`Relationship Error: ${id} entity must have a ${source} property assigned`);
          isValid = false;
        }
        if (!properties.hasOwnProperty(target)) {
          errors.push(`Relationship Error: ${id} entity must have a ${target} property assigned`);
          isValid = false;
        }
      }
    })

    if (!isValid) {
      showErrorToast({ message: errors.map(error => <li>{error}</li>) });
    }

    return isValid;
  }

  formatMappings() {
    const { entity } = this.props;
    const { mappings, csvData } = this.state;
    const toFormat = {};

    mappings.forEach(({id, schema, keys, properties}) => {
      toFormat[id] = {
        schema: schema.name,
        keys,
        properties
      };
    });

    return {
      table_id: entity.id,
      mapping_query: toFormat,
    };
  }

  loadFromMapping(existingMapping) {
    const { model } = this.props;

    const mappings = new Map();

    Object.values(existingMapping.query).forEach(({keys, schema, properties}, i) => {
      mappings.set(schema, {
        id: schema,
        color: colorOptions[i%colorOptions.length],
        schema: model.getSchema(schema),
        keys,
        properties,
      })
    });

    this.setState({ existingMappingId: existingMapping.id, mappings: mappings });
  }

  render() {
    const { entity, model, existingMappings } = this.props;
    const { mappings, csvData, csvHeader, existingMappingId } = this.state;

    if (!csvData || !csvHeader) {
      return null;
    }

    console.log('mappings', mappings);
    console.log('existing mappings are', existingMappings)

    console.log('entity is', entity.getProperty('fileName'));

    const existingMapping = existingMappings.length && !existingMappings.isLoading && !existingMappings.isError ? existingMappings[0] : null

    // console.log('csv data is', csvData);

    const [things, relationships] = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => item.isCreateable && !item.abstract && !mappings.has(item.name))
      .reduce((result, schema) => {
        result[schema.isEdge ? 1 : 0].push(schema);
        return result;
      },[[], []]);

    const [mappedThings, mappedRelationships] = Array.from(mappings.values())
      .reduce((result, element) => {
        result[element.schema.isEdge ? 1 : 0].push(element);
        return result;
      },[[], []])

    console.log(mappedThings);

    return (
      <div className="EntityImport">
        <h1 className="text-page-title">
          <FormattedMessage id="mapping.title" defaultMessage="Import as structured entities" />
        </h1>
        <p className="text-page-subtitle">
        <FormattedMessage
          id="mapping.info"
          defaultMessage="Follow the steps below to map items in this dataset to structured Follow the Money entites. For more information, please refer to the {link}"
          values={{
            link: (
              <a
                href="https://docs.alephdata.org/developers/mappings"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FormattedMessage
                  id="collection.mapping.infoLink"
                  defaultMessage="Aleph data mapping documentation"
                />
              </a>
            ),
          }}
        />
        </p>
        <div className="EntityImport__sections">
          <div className="EntityImport__section">
            <h5 className="bp3-heading EntityImport__section__title">
              1. Select entity types to map
            </h5>
            <div className="EntityImport__split-section-container">
              <div className="EntityImport__split-section">
                <h6 className="EntityImport__split-section__title bp3-heading">Objects</h6>
                <MappingSelect
                  items={things}
                  label="object"
                  onSelect={this.onMappingAdd}
                />
                <MappingList
                  editable
                  columnLabels={csvHeader}
                  items={mappedThings}
                  onKeyAssign={this.onKeyAssign}
                  onKeyRemove={this.onKeyRemove}
                  onPropertyAssign={this.onPropertyAssign}
                  onMappingRemove={this.onMappingRemove}
                />
              </div>
              <div className="EntityImport__split-section">
                <h6 className="EntityImport__split-section__title bp3-heading">Relationships</h6>
                <MappingSelect
                  items={relationships}
                  label="relationship"
                  onSelect={this.onMappingAdd}
                />
                <MappingList
                  editable
                  columnLabels={csvHeader}
                  items={mappedRelationships}
                  fullMappingsList={mappings}
                  onKeyAssign={this.onKeyAssign}
                  onKeyRemove={this.onKeyRemove}
                  onPropertyAssign={this.onPropertyAssign}
                  onMappingRemove={this.onMappingRemove}
                />
              </div>
            </div>
          </div>
          {mappings.size > 0 && (
            <React.Fragment>
              <div className="EntityImport__section">
                <h5 className="bp3-heading EntityImport__section__title">
                  2. Map columns to properties
                </h5>
                <EntityImportPropertyAssign
                  columnLabels={csvHeader}
                  csvData={csvData}
                  mappings={mappings}
                  onPropertyAssign={this.onPropertyAssign}
                />
              </div>
              <div className="EntityImport__section">
                <h5 className="bp3-heading EntityImport__section__title">
                  3. Verify
                </h5>
                <div className="EntityImport__split-section-container">
                  <div className="EntityImport__split-section">
                    <h4 className="EntityImport__split-section__title">Objects</h4>
                    <MappingVerify
                      items={mappedThings}
                      onPropertyAssign={this.onPropertyAssign}
                    />
                  </div>
                  <div className="EntityImport__split-section">
                    <h4 className="EntityImport__split-section__title">Relationships</h4>
                    <MappingVerify
                      items={mappedRelationships}
                      fullMappingsList={mappings}
                      onPropertyAssign={this.onPropertyAssign}
                    />
                  </div>
                </div>
              </div>
              <div className="EntityImport__section">
                {existingMapping && (
                  <MappingStatus
                    collection={entity.collection}
                    mapping={existingMapping}
                  />
                )}
                <EntityImportManageMenu
                  mappings={this.formatMappings(mappings)}
                  collectionId={entity.collection.id}
                  mappingId={existingMappingId}
                  validate={this.onValidate}
                />
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.entity.collection.id;
  console.log('state is', state);
  return {
    model: selectModel(state),
    existingMappings: selectCollectionMappings(state, collectionId)
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportMode);
