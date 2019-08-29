/* eslint-disable */
import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { selectModel } from 'src/selectors';
import { Button, Card, FormGroup, H5, Intent, MenuItem } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
import { Property } from 'src/components/common';
import Papa from 'papaparse';
import { showErrorToast } from "../../app/toast";
import { defineMessages, injectIntl } from "react-intl";
import { ingestDocument, makeMapping } from 'src/actions';

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
  <MenuItem style={{ maxWidth: '30vw' }}
            key={item.id}
            text={item.label}
            label={item.helptext}
            onClick={handleClick}
  />
);

const csvColumnTagRenderer = (item) => item;

export class EntityImport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      importModel: null,
      csvRows: [],
      csvLoading: true,
      mapping: {
        keys: [],
        properties: {}
      },
      isSubmitting: false
    };
  }

  componentDidMount() {
    this.fetchCsvRows();
  }

  fetchCsvRows() {
    const { document } = this.props;
    this.setState({ csvLoading: true });

    const url = document.links.csv;
    // set chunk size to 100 KB
    Papa.RemoteChunkSize = 1024 * 100;
    Papa.parse(url, {
      download: true,
      delimiter: ',',
      newline: '\n',
      encoding: 'utf-8',
      // header: true,
      chunk: (results, parser) => {
        this.setState({
          csvRows: results.data.slice(0, 10),
          csvLoading: false
        });
        parser.abort();
      }
    })
  }

  onModelSelect(model) {
    this.setState({ importModel: model });
  }

  onCsvColumnSelect(entityProp, csvColumn) {
    const { mapping } = this.state;
    const newMapping = Object.assign({}, mapping);
    newMapping.properties[entityProp] = {
      column: csvColumn.id
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

  getMappingForProp(prop) {
    const { mapping } = this.state;
    return mapping.properties[prop] || {};
  }

  async onFormSubmit(event) {
    console.log("on submit");
    event.preventDefault();
    const { intl, document, makeMapping } = this.props;
    const { mapping, importModel, isSubmitting } = this.state;
    if (isSubmitting) {
      return;
    }
    this.setState({ isSubmitting: true });
    try {
      const completeMapping = {};
      completeMapping[document.collection.foreign_id] = {
        queries: [{
          csv_url: document.links.csv.replace(/localhost:8080/, 'api:5000'),
          entities: {
            a: Object.assign({
              schema: importModel.name,
            }, mapping)
          }
        }]
      };
      console.log(completeMapping);
      await makeMapping(document.collection.id, completeMapping);
    } catch (e) {
      console.error(e);
      showErrorToast(intl.formatMessage(messages.error));
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { model, document } = this.props;
    const { importModel, csvRows, mapping, isSubmitting } = this.state;
    let csvColumns;
    if (importModel) {
      const columnsJson = document.getFirst('columns');
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
          label: label
        }
      });
    }

    console.log(document);

    const items = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => item.isCreateable && !item.abstract && item.schemata.indexOf('Thing') >= 0)
      .sort((a, b) => a.label.localeCompare(b.label));
    return (
      <form onSubmit={(ev) => this.onFormSubmit(ev)}>
        <Card style={{ marginBottom: '1rem' }}>
          <FormGroup
            helperText="Which entity would you like to create?"
            label="Entity-Type"
            labelFor="entity-type"
            labelInfo="(required)"
          >
            <Select
              id="entity-type"
              items={items}
              filterable={false}
              itemRenderer={itemRenderer}
              onItemSelect={item => this.onModelSelect(item)}
            >
              <Button text={importModel ? importModel.label : 'Please choose an entity-type'}
                      rightIcon="double-caret-vertical"/>
            </Select>
          </FormGroup>
        </Card>
        {importModel && (
          <section>
            <Card style={{ marginBottom: '1rem' }}>
              <FormGroup
                helperText="Assign the fields in your csv to properties of the entity"
                label="Field-Mapping"
                labelInfo="(required)"
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
                    .map(prop => <tr key={prop}>
                      <td><Property.Name prop={importModel.getProperty(prop)}/></td>
                      <td><Select
                        id={`csv-column-${prop}`}
                        items={csvColumns}
                        filterable={false}
                        itemRenderer={csvColumnRenderer}
                        onItemSelect={item => this.onCsvColumnSelect(prop, item)}
                      >
                        <Button text={this.getMappingForProp(prop).column || "(none)"}
                                rightIcon="double-caret-vertical"/>
                      </Select></td>
                    </tr>)}
                  </tbody>
                </table>
              </FormGroup>
              <FormGroup
                label="Keys"
                labelInfo="(required)"
              >
                <MultiSelect
                  items={csvColumns}
                  itemRenderer={csvColumnRenderer}
                  tagRenderer={csvColumnTagRenderer}
                  onItemSelect={item => this.onCsvKeySelect(item)}
                  selectedItems={mapping.keys}
                  itemPredicate={() => true}
                  tagInputProps={{
                    onRemove: (item) => this.onCsvKeyRemove(item),
                  }}
                  noResults={
                    <MenuItem disabled text="No Results"/>
                  }
                />
              </FormGroup>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting}
              intent={Intent.PRIMARY}
              text="Import"
              onClick={(ev) => this.onFormSubmit(ev)}
            />
          </section>
        )}
      </form>
    );
  }
}

const mapDispatchToProps = { makeMapping };

const mapStateToProps = state => ({
  model: selectModel(state),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(EntityImport);
