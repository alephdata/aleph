import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import Papa from 'papaparse';
import { Colors } from '@blueprintjs/core';
import { showErrorToast } from 'src/app/toast';
import { fetchCollectionMappings } from 'src/actions';
import { selectCollectionMappings, selectModel } from 'src/selectors';
import {
  MappingKeyAssign,
  MappingManageMenu,
  MappingPropertyAssign,
  MappingSchemaSelect,
  MappingSplitSection,
  MappingStatus,
  MappingVerify,
} from '.';

import './EntityMappingMode.scss';

const colorOptions = [
  Colors.BLUE1, Colors.TURQUOISE1, Colors.VIOLET1, Colors.ORANGE1, Colors.GREEN1, Colors.RED1,
];

const messages = defineMessages({
  keyError: {
    id: 'mapping.error.keyMissing',
    defaultMessage: 'Key Error: {id} entity must have at least one key',
  },
  relationshipError: {
    id: 'mapping.error.relationshipMissing',
    defaultMessage: 'Relationship Error: {id} entity must have a {source} and {target} assigned',
  },
  section1Title: {
    id: 'mapping.section1.title',
    defaultMessage: '1. Select entity types to map',
  },
  section2Title: {
    id: 'mapping.section2.title',
    defaultMessage: '2. Map columns to entity properties',
  },
  section3Title: {
    id: 'mapping.section3.title',
    defaultMessage: '3. Verify',
  },
});

export class EntityMappingMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mappings: new Map(),
      csvData: null,
    };

    this.onMappingAdd = this.onMappingAdd.bind(this);
    this.onMappingRemove = this.onMappingRemove.bind(this);
    this.onKeyAdd = this.onKeyAdd.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onPropertyAdd = this.onPropertyAdd.bind(this);
    this.onPropertyRemove = this.onPropertyRemove.bind(this);
    this.onValidate = this.onValidate.bind(this);
  }

  componentDidMount() {
    this.fetchCsvData();
    this.props.fetchCollectionMappings(this.props.entity.collection.id);
  }

  componentDidUpdate(prevProps) {
    const { existingMappings } = this.props;
    if (existingMappings && existingMappings.length && !existingMappings.isLoading
      && !existingMappings.isError && prevProps.existingMappings !== existingMappings) {
      this.loadFromMapping(existingMappings[0]);
    }
  }

  onMappingAdd(schema) {
    const { mappings } = this.state;
    const clone = new Map(mappings);
    const id = schema.name;
    const index = mappings.size;

    const newMapping = {
      id,
      color: colorOptions[index % colorOptions.length],
      schema,
      keys: [],
      properties: {},
    };
    clone.set(id, newMapping);

    this.setState({ mappings: clone });
  }

  onMappingRemove(schema) {
    const { mappings } = this.state;
    const clone = new Map(mappings);
    clone.delete(schema.name);

    this.setState({ mappings: clone });
  }

  onKeyAdd(mappingId, key) {
    this.updateMappings(mappingId, mappingObj => mappingObj.keys.push(key));
  }

  onKeyRemove(mappingId, key) {
    this.updateMappings(mappingId, mappingObj => {
      const index = mappingObj.keys.indexOf(key);
      if (index !== -1) {
        mappingObj.keys.splice(index, 1);
      }
    });
  }

  onPropertyAdd(mappingId, propName, value) {
    this.updateMappings(mappingId, (mappingObj) => { mappingObj.properties[propName] = value; });
  }

  onPropertyRemove(mappingId, propName) {
    this.updateMappings(mappingId, (mappingObj) => { delete mappingObj.properties[propName]; });
  }

  onValidate() {
    const { intl } = this.props;
    const { mappings } = this.state;
    const errors = [];
    let isValid = true;

    mappings.forEach(({ id, keys, properties, schema }) => {
      if (keys.length === 0) {
        errors.push(intl.formatMessage(messages.keyError, { id }));
        isValid = false;
      }
      if (schema.isEdge) {
        const { source, target } = schema.edge;

        if (!properties[source] || !properties[target]) {
          errors.push(intl.formatMessage(messages.relationshipError, { id, source, target }));
          isValid = false;
        }
      }
    });

    if (!isValid) {
      showErrorToast({ message: errors.map(error => <li key={error}>{error}</li>) });
    }

    return isValid;
  }

  updateMappings(mappingId, updateToApply) {
    const { mappings } = this.state;
    const clone = new Map(mappings);

    const newMappingObj = clone.get(mappingId);
    if (newMappingObj) {
      updateToApply(newMappingObj);
      this.setState({ mappings: clone });
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
          csvHeader: results.data[0],
          csvData: results.data.slice(1, 15),
        });
        parser.abort();
      },
    });
  }

  formatMappings() {
    const { entity } = this.props;
    const { mappings } = this.state;
    const query = {};

    mappings.forEach(({ id, schema, keys, properties }) => {
      query[id] = {
        schema: schema.name,
        keys,
        properties,
      };
    });

    return {
      table_id: entity.id,
      mapping_query: query,
    };
  }

  loadFromMapping(existingMapping) {
    const { model } = this.props;

    const mappings = new Map();

    Object.values(existingMapping.query).forEach(({ keys, schema, properties }, i) => {
      mappings.set(schema, {
        id: schema,
        color: colorOptions[i % colorOptions.length],
        schema: model.getSchema(schema),
        keys,
        properties,
      });
    });

    this.setState({ existingMappingId: existingMapping.id, mappings });
  }

  render() {
    const { entity, intl, model, existingMappings } = this.props;
    const { mappings, csvData, csvHeader, existingMappingId } = this.state;

    if (!csvData || !csvHeader) {
      return null;
    }

    console.log(csvData, csvHeader);

    const existingMapping = existingMappings.length && !existingMappings.isLoading
      && !existingMappings.isError ? existingMappings[0] : null;

    const schemaSelectOptions = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => item.isCreateable && !item.abstract && !mappings.has(item.name))
      .reduce((result, schema) => {
        result[schema.isEdge ? 1 : 0].push(schema);
        return result;
      }, [[], []]);

    return (
      <div className="EntityMappingMode">
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
                    id="mapping.infoLink"
                    defaultMessage="Aleph data mapping documentation"
                  />
                </a>
              ),
            }}
          />
        </p>
        <div className="EntityMappingMode__sections">
          <div className="EntityMappingMode__section">
            <h5 className="bp3-heading EntityMappingMode__section__title">
              {intl.formatMessage(messages.section1Title)}
            </h5>
            <MappingSplitSection
              items={Array.from(mappings.values())}
              sectionContentsRenderer={((subitems, type) => (
                <>
                  <MappingSchemaSelect
                    schemaSelectOptions={schemaSelectOptions}
                    type={type}
                    onSelect={this.onMappingAdd}
                  />
                  <MappingKeyAssign
                    columnLabels={csvHeader}
                    items={subitems}
                    fullMappingsList={mappings}
                    onKeyAdd={this.onKeyAdd}
                    onKeyRemove={this.onKeyRemove}
                    onPropertyAdd={this.onPropertyAdd}
                    onMappingRemove={this.onMappingRemove}
                  />
                </>
              ))}
            />
          </div>
          {mappings.size > 0 && (
            <>
              <div className="EntityMappingMode__section">
                <h5 className="bp3-heading EntityMappingMode__section__title">
                  {intl.formatMessage(messages.section2Title)}
                </h5>
                <MappingPropertyAssign
                  columnLabels={csvHeader}
                  csvData={csvData}
                  mappings={mappings}
                  onPropertyAdd={this.onPropertyAdd}
                />
              </div>
              <div className="EntityMappingMode__section">
                <h5 className="bp3-heading EntityMappingMode__section__title">
                  {intl.formatMessage(messages.section3Title)}
                </h5>
                <MappingSplitSection
                  items={Array.from(mappings.values())}
                  sectionContentsRenderer={(subitems => (
                    <MappingVerify
                      items={subitems}
                      fullMappingsList={mappings}
                      onPropertyRemove={this.onPropertyRemove}
                      onPropertyAdd={this.onPropertyAdd}
                    />
                  ))}
                />
              </div>
              <div className="EntityMappingMode__section">
                {existingMapping && (
                  <MappingStatus
                    collection={entity.collection}
                    mapping={existingMapping}
                  />
                )}
                <MappingManageMenu
                  mappings={this.formatMappings(mappings)}
                  collectionId={entity.collection.id}
                  mappingId={existingMappingId}
                  validate={this.onValidate}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.entity.collection.id;
  return {
    model: selectModel(state),
    existingMappings: selectCollectionMappings(state, collectionId),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityMappingMode);
