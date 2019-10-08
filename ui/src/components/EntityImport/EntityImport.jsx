import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { selectModel } from 'src/selectors';
import { Button, Card, FormGroup, Callout, H5, Intent, MenuItem } from '@blueprintjs/core';
import { Select, MultiSelect } from '@blueprintjs/select';
import Property from 'src/components/Property';
import Papa from 'papaparse';
import { defineMessages, injectIntl } from 'react-intl';
import { makeMapping } from 'src/actions';
import './EntityImport.scss';
import { showErrorToast } from 'src/app/toast';


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

export class EntityImport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      importModel: null,
      schema: 'Thing',
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

  onSchemaSelect(schema) {
    this.setState({ schema: schema.name });
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
    const { intl, document } = this.props;
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
            }, mapping),
          },
        }],
      };
      await this.props.makeMapping(document.collection.id, completeMapping);
    } catch (e) {
      console.error(e);
      showErrorToast(intl.formatMessage(messages.error));
      this.setState({ isSubmitting: false });
    }
  }

  getMappingForProp(prop) {
    const { mapping } = this.state;
    return mapping.properties[prop] || {};
  }

  fetchCsvRows() {
    const { document } = this.props;
    const url = document.links.csv;
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
    const { model, document } = this.props;
    const { schema, importModel, csvRows, mapping, isSubmitting } = this.state;
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
          label,
        };
      });
    }

    const items = Object.keys(model.schemata)
      .map(key => model.schemata[key])
      .filter(item => item.isCreateable && !item.abstract && item.schemata.indexOf(schema) >= 0)
      .sort((a, b) => a.label.localeCompare(b.label));

    const schemata = [{
      name: 'Thing',
      label: 'Thing',
    }, {
      name: 'Interval',
      label: 'Interval',
    }];
    return (
      <form onSubmit={ev => this.onFormSubmit(ev)}>
        <Card style={{ marginBottom: '1rem' }}>
          <H5>Entity to create per row</H5>
          <FormGroup
            helperText={(
              <span>
                select
                <em>Interval</em>
                if you want to create some sort of relationship (payment, contract, ...)
              </span>
            )}
            label="Schema"
            labelFor="schema"
          >
            <Select
              id="schema"
              items={schemata}
              filterable={false}
              itemRenderer={itemRenderer}
              onItemSelect={item => this.onSchemaSelect(item)}
            >
              <Button
                text={schema || 'Please choose a schema'}
                rightIcon="double-caret-vertical"
              />
            </Select>
          </FormGroup>
          <FormGroup
            helperText={<span>Derived types from the selected Follow The Money schema</span>}
            label="Entity-Type"
            labelFor="entity-type"
          >
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
          <section>
            <Card style={{ marginBottom: '1rem' }}>
              <H5>Properties for the entity</H5>
              <FormGroup
                helperText="Assign the fields in your csv to properties of the entity"
                label="Field-Mapping"
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
              <FormGroup
                helperText={(
                  <span>
                    All keys combined specify the id of the entity. The id has
                    to be unique and can be refered when creating relationships.
                  </span>
                )}
                label="Keys"
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
                  popoverProps={{ popoverClassName: 'EntityImportForm-popover' }}
                />
              </FormGroup>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting}
              intent={Intent.PRIMARY}
              text="Import"
              onClick={ev => this.onFormSubmit(ev)}
            />
          </section>
        )}
        <Callout intent="primary" title="Look up the schema" style={{ marginTop: '1rem' }}>
          It is very helpful to have a look into the documentation of the
          <a
            href="https://docs.alephdata.org/developers/followthemoney#schema"
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow the Money schema
          </a>
          while filling out this form
        </Callout>
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
  injectIntl,
)(EntityImport);
