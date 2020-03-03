import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import Papa from 'papaparse';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { SectionLoading } from 'src/components/common';
import { showErrorToast } from 'src/app/toast';
import { fetchCollectionMappings } from 'src/actions';
import { selectCollectionMappings, selectModel } from 'src/selectors';
import MappingPreviewDialog from 'src/dialogs/MappingPreviewDialog/MappingPreviewDialog';
import {
  MappingKeyAssign,
  MappingManageMenu,
  MappingPropertyAssign,
  MappingSchemaSelect,
  MappingSplitSection,
  MappingStatus,
  MappingVerify,
} from '.';
import { assignMappingColor } from './util';

import './EntityMappingMode.scss';


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
      previewIsOpen: false,
    };

    this.onMappingAdd = this.onMappingAdd.bind(this);
    this.onMappingRemove = this.onMappingRemove.bind(this);
    this.onKeyAdd = this.onKeyAdd.bind(this);
    this.onKeyRemove = this.onKeyRemove.bind(this);
    this.onPropertyAdd = this.onPropertyAdd.bind(this);
    this.onPropertyRemove = this.onPropertyRemove.bind(this);
    this.onValidate = this.onValidate.bind(this);
    this.togglePreview = this.togglePreview.bind(this);
  }

  componentDidMount() {
    const { existingMapping } = this.props;
    this.fetchCsvData();
    this.fetchIfNeeded();
    if (existingMapping) {
      this.loadFromMapping(existingMapping);
    }
  }

  componentDidUpdate(prevProps) {
    const { existingMapping } = this.props;

    // this.fetchIfNeeded();
    if (existingMapping && prevProps.existingMapping !== existingMapping) {
      this.loadFromMapping(existingMapping);
    }
  }

  assignId(schemaToAssign) {
    const { mappings } = this.state;
    const { name } = schemaToAssign;

    const mappingsOfSchema = Array.from(mappings.values()).filter(({ schema }) => { console.log(schema, schemaToAssign); return schema === schemaToAssign; });
    const schemaMappingsCount = mappingsOfSchema.length;

    return schemaMappingsCount ? `${schemaToAssign.label} ${schemaMappingsCount + 1}` : schemaToAssign.label;
  }

  onMappingAdd(schema) {
    const { mappings } = this.state;
    const clone = new Map(mappings);
    const id = this.assignId(schema);

    const newMapping = {
      id,
      color: assignMappingColor(mappings),
      schema,
      keys: [],
      properties: {},
    };
    clone.set(id, newMapping);

    this.setState({ mappings: clone });
  }

  onMappingRemove(id) {
    const { mappings } = this.state;
    const clone = new Map(mappings);
    clone.delete(id);

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
    console.log('in prop add', mappingId, propName, value);
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

  togglePreview = () => this.setState(({ previewIsOpen }) => (
    { previewIsOpen: !previewIsOpen }
  ));

  fetchIfNeeded() {
    const { entity, collectionMappings } = this.props;
    if (entity.id && collectionMappings.shouldLoad) {
      this.props.fetchCollectionMappings(entity.collection.id);
    }
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

    Object.entries(existingMapping.query).forEach(([id, { keys, schema, properties }]) => {
      mappings.set(id, {
        id,
        color: assignMappingColor(mappings),
        schema: model.getSchema(schema),
        keys,
        properties,
      });
    });

    this.setState({ mappings });
  }

  render() {
    const { entity, intl, model, existingMapping, collectionMappings } = this.props;
    const { mappings, csvData, csvHeader, previewIsOpen } = this.state;

    if (!csvData || !csvHeader || collectionMappings.isLoading) {
      return <SectionLoading />;
    }

    console.log('collectionMappings', collectionMappings);
    console.log('existingMapping', existingMapping);
    console.log('mappings', mappings);


    const schemaSelectOptions = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => !item.generated && !item.abstract)
      .reduce((result, schema) => {
        result[schema.isEdge ? 1 : 0].push(schema);
        return result;
      }, [[], []]);

    return (
      <div className="EntityMappingMode">
        <div className="EntityMappingMode__title-container">
          <h1 className="text-page-title">
            <FormattedMessage id="mapping.title" defaultMessage="Generate structured entities" />
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
        </div>
        {existingMapping && (
          <MappingStatus
            collection={entity.collection}
            mapping={existingMapping}
          />
        )}
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
                  onPropertyRemove={this.onPropertyRemove}
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
                <ButtonGroup className="EntityMappingMode__preview">
                  <Button icon="eye-open" onClick={this.togglePreview}>
                    <FormattedMessage id="mapping.actions.preview" defaultMessage="Preview mapping" />
                  </Button>
                </ButtonGroup>
              </div>
              <div className="EntityMappingMode__section">
                <MappingManageMenu
                  mappings={this.formatMappings(mappings)}
                  collectionId={entity.collection.id}
                  mappingId={existingMapping && existingMapping.id}
                  validate={this.onValidate}
                />
              </div>
            </>
          )}
        </div>
        <MappingPreviewDialog
          isOpen={previewIsOpen}
          mappings={this.formatMappings(mappings)}
          toggleDialog={this.togglePreview}
        />
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = (state, ownProps) => {
  const { entity } = ownProps;
  const collectionMappings = selectCollectionMappings(state, entity.collection.id);
  const entityMapping = collectionMappings.results && collectionMappings.results.length > 0
    ? collectionMappings.results.find(mapping => mapping.table_id === entity.id) : undefined;

  return {
    collectionMappings,
    model: selectModel(state),
    existingMapping: entityMapping,
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityMappingMode);
