import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { selectModel } from 'src/selectors';
import { Button, FormGroup, Callout, Card, H5, Intent, MenuItem } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
// import { Schema } from 'src/components/common';
import Property from 'src/components/Property';
import Papa from 'papaparse';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { makeMapping, fetchMapping } from 'src/actions';
import { showErrorToast } from 'src/app/toast';

import './EntityImportMode.scss';

const messages = defineMessages({
  error: {
    id: 'collection.mapping.error',
    defaultMessage: 'There was an error creating the mapping.',
  },
});

const itemRenderer = (item, { handleClick }) => (
  <MenuItem
    key={item.name}
    text={item.label}
    onClick={handleClick}
  />
);

const csvColumnRenderer = (item, { handleClick }) => (
  <MenuItem
    style={{ maxWidth: '30vw' }}
    key={item.id}
    text={item.label}
    label={item.helptext}
    onClick={handleClick}
  />
);

const csvColumnTagRenderer = item => item;

export class EntityImportMode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      importModel: null,
      csvRows: [],
      mapping: {
        keys: [],
        properties: {},
      },
      isSubmitting: false,
    };
  }

  componentDidMount() {
    this.fetchCsvRows();
  }

  onModelSelect(model) {
    this.setState({ importModel: model });
  }

  onCsvColumnSelect(entityProp, csvColumn) {
    const { mapping } = this.state;
    const newMapping = Object.assign({}, mapping);
    newMapping.properties[entityProp] = {
      column: csvColumn.id,
    };
    this.setState({ mapping: newMapping });
  }

  onCsvKeySelect(csvColumn) {
    const { mapping } = this.state;
    if (mapping.keys.indexOf(csvColumn.id) < 0) {
      const newMapping = Object.assign({}, mapping);
      newMapping.keys.push(csvColumn.id);
      this.setState({ mapping: newMapping });
    }
  }

  onCsvKeyRemove(csvColumnId) {
    const { mapping } = this.state;
    const columnIndex = mapping.keys.indexOf(csvColumnId);
    if (columnIndex >= 0) {
      const newMapping = Object.assign({}, mapping);
      newMapping.keys.splice(columnIndex, 1);
      this.setState({ mapping: newMapping });
    }
  }

  async onFormSubmit(event) {
    event.preventDefault();
    const { intl, entity } = this.props;
    const { isSubmitting } = this.state;
    if (isSubmitting) {
      return;
    }
    this.setState({ isSubmitting: true });
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

  getMappingForProp(prop) {
    const { mapping } = this.state;

    // console.log('mapping for prop', mapping.properties[prop]);
    return mapping.properties[prop] || {};
  }

  fetchCsvRows() {
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
          csvRows: results.data.slice(0, 10),
        });
        parser.abort();
      },
    });
  }

  render() {
    const { model, entity } = this.props;
    // console.log('entity', entity);
    const { importModel, csvRows, mapping, isSubmitting } = this.state;
    let csvColumns;
    if (importModel) {
      const columnsJson = entity.getFirst('columns');
      const columns = columnsJson ? JSON.parse(columnsJson) : [];
      csvColumns = columns.map((column, index) => {
        let label = column;
        let alternateLabel = null;
        if (csvRows[0] && csvRows[0][index]) {
          alternateLabel = label;
          label = csvRows[0][index];
        }
        return {
          id: label,
          helptext: alternateLabel,
          label,
          sample: csvRows[1][index],
        };
      });
      // console.log(columnsJson, columns, csvColumns);
    }

    const items = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => item.isCreateable && !item.abstract && item.schemata.indexOf('Thing') >= 0)
      .sort((a, b) => a.label.localeCompare(b.label));

    // console.log('csv rows', csvRows);

    // const previewRow = csvRows[1];

    return (
      <div className="EntityImportMode">
        <Callout className="EntityImportMode__info">
          <FormattedMessage
            id="collection.mapping.info"
            defaultMessage="Use the form below to map rows in this dataset to structured Follow the Money entites. For more information, please refer to the {link}"
            values={{
              link: (
                <a
                  href="https://docs.alephdata.org/developers/followthemoney#schema"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FormattedMessage
                    id="collection.mapping.infoLink"
                    defaultMessage="Follow the Money schema"
                  />
                </a>
              ),
            }}
          />
        </Callout>
        <form onSubmit={ev => this.onFormSubmit(ev)}>
          <Card style={{ marginBottom: '1rem' }}>
            <H5>
              <FormattedMessage
                id="collection.mapping.selectType"
                defaultMessage="Select an entity type"
              />
            </H5>
            <FormGroup>
              <Select
                id="entity-type"
                items={items}
                filterable={false}
                itemRenderer={itemRenderer}
                onItemSelect={item => this.onModelSelect(item)}
              >
                <Button
                  text={importModel ? importModel.label : 'Please choose an Entity-Type'}
                  rightIcon="double-caret-vertical"
                />
              </Select>
            </FormGroup>
          </Card>
          {importModel && (
            <React.Fragment>
              <div className="EntityImportMode__section">
                <div className="EntityImportMode__section__title">
                  <H5>Unique identifier keys</H5>
                </div>
                <div className="EntityImportMode__section__form">
                  <FormGroup
                    helperText={(
                      <span>
                        All keys combined specify the id of the entity. The id has
                        to be unique and can be refered when creating relationships.
                      </span>
                    )}
                  >
                    <MultiSelect
                      items={csvColumns}
                      itemRenderer={csvColumnRenderer}
                      tagRenderer={csvColumnTagRenderer}
                      onItemSelect={item => this.onCsvKeySelect(item)}
                      selectedItems={mapping.keys}
                      itemPredicate={() => true}
                      tagInputProps={{
                        onRemove: item => this.onCsvKeyRemove(item),
                      }}
                      noResults={
                        <MenuItem disabled text="No Results" />
                      }
                      popoverProps={{ popoverClassName: 'EntityImportModeForm-popover' }}
                    />
                  </FormGroup>
                </div>
              </div>
              <div className="EntityImportMode__section">
                <div className="EntityImportMode__section__title">
                  <H5>Properties for the entity</H5>
                </div>
                <div className="EntityImportMode__section__form">
                  <FormGroup
                    helperText="Assign the fields in your csv to properties of the entity"
                  >
                    <table className="bp3-html-table bp3-html-table-condensed bp3-small bp3-html-table-striped">
                      <thead>
                        <tr>
                          <td>Entity</td>
                          <td>CSV</td>
                        </tr>
                      </thead>
                      <tbody>
                        {importModel.featured
                          .sort((a, b) => a.localeCompare(b))
                          .map(prop => (
                            <tr key={prop}>
                              <td><Property.Name prop={importModel.getProperty(prop)} /></td>
                              <td>
                                <Select
                                  id={`csv-column-${prop}`}
                                  items={csvColumns}
                                  filterable={false}
                                  itemRenderer={csvColumnRenderer}
                                  onItemSelect={item => this.onCsvColumnSelect(prop, item)}
                                >
                                  <Button
                                    text={this.getMappingForProp(prop).column || '(none)'}
                                    rightIcon="double-caret-vertical"
                                  />
                                </Select>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </FormGroup>
                </div>
                <div className="EntityImportMode__section__preview" />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                intent={Intent.PRIMARY}
                text="Import"
                onClick={ev => this.onFormSubmit(ev)}
              />
            </React.Fragment>
          )}
        </form>
      </div>
    );
  }
}

const mapDispatchToProps = { makeMapping, fetchMapping };

const mapStateToProps = state => ({
  model: selectModel(state),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportMode);
