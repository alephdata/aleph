import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';

import withRouter from '/src/app/withRouter.jsx';
import {
  csvContextLoader,
  SectionLoading,
} from '/src/components/common/index.jsx';
import { DialogToggleButton } from '/src/components/Toolbar';
import MappingImportDialog from '/src/dialogs/MappingImportDialog/MappingImportDialog.jsx';
import { fetchEntityMapping } from '/src/actions/index.js';
import { selectEntityMapping } from '/src/selectors.js';
import { MappingEditor, MappingStatus } from '/src/components/MappingEditor/.';

import './EntityMappingMode.scss';

const messages = defineMessages({
  import: {
    id: 'mapping.import.button',
    defaultMessage: 'Import existing mapping',
  },
});

export class EntityMappingMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      importedMappingData: null,
    };

    this.onImport = this.onImport.bind(this);
  }

  componentDidMount() {
    const { document, existingMapping } = this.props;

    if (document.id && existingMapping.shouldLoad) {
      this.props.fetchEntityMapping(document);
    }
  }

  onImport(mappingData) {
    const processedData = this.processImportedMappings(mappingData);

    this.setState({ importedMappingData: processedData });
  }

  processImportedMappings(mappingData) {
    const { columns, rows } = this.props;
    const headerColumns = this.useFirstRowAsHeader() ? rows[0] : columns;

    const processed = {};
    Object.entries(mappingData).forEach(
      ([id, { schema, keys, properties }]) => {
        const processedKeys = keys.filter(
          (key) => headerColumns.indexOf(key) > -1
        );
        const processedProps = {};

        if (properties) {
          Object.entries(properties).forEach(([propName, propVal]) => {
            if (
              propVal.columns ||
              (propVal.column && headerColumns.indexOf(propVal.column) === -1)
            ) {
              return;
            }
            if (propVal.literal && typeof propVal.literal === 'string') {
              processedProps[propName] = { literal: [propVal.literal] };
              return;
            }
            processedProps[propName] = propVal;
          });
        }

        processed[id] = {
          schema,
          keys: processedKeys,
          properties: processedProps,
        };
      }
    );

    return processed;
  }

  useFirstRowAsHeader() {
    const { columns, rows } = this.props;
    return rows.length > 0 && columns[0] === 'Column 1';
  }

  render() {
    const {
      columns,
      document,
      existingMapping,
      intl,
      prefilledSchemaData,
      rows,
    } = this.props;
    const { importedMappingData } = this.state;

    if (!rows || !columns || existingMapping.isPending) {
      return <SectionLoading />;
    }

    const showImport =
      !existingMapping.isPending && !importedMappingData && !existingMapping.id;

    return (
      <div className="EntityMappingMode">
        <div className="EntityMappingMode__title-container">
          <h1 className="text-page-title">
            <FormattedMessage
              id="mapping.title"
              defaultMessage="Generate structured entities"
            />
          </h1>
          <p className="text-page-subtitle">
            <FormattedMessage
              id="mapping.info"
              defaultMessage="Follow the steps below to map items in this investigation to structured entites. For more information, please refer to the {link}."
              values={{
                link: (
                  <a
                    href="https://docs.aleph.occrp.org/users/investigations/cross-referencing/#generating-entities-from-yourspreadsheet"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FormattedMessage
                      id="mapping.info.link"
                      defaultMessage="Aleph user guide"
                    />
                  </a>
                ),
              }}
            />
          </p>
        </div>

        {showImport && (
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.import),
              icon: 'import',
            }}
            Dialog={MappingImportDialog}
            dialogProps={{ onSubmit: this.onImport }}
          />
        )}

        {existingMapping.id && <MappingStatus mapping={existingMapping} />}
        <MappingEditor
          document={document}
          csvData={this.useFirstRowAsHeader() ? rows.slice(1) : rows}
          csvHeader={this.useFirstRowAsHeader() ? rows[0] : columns}
          mappingData={
            importedMappingData || existingMapping?.query || prefilledSchemaData
          }
          existingMappingMetadata={existingMapping}
        />
      </div>
    );
  }
}

const mapDispatchToProps = { fetchEntityMapping };

const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;

  const parsedHash = queryString.parse(location.hash);
  const urlSchema = parsedHash.schema;

  return {
    existingMapping: selectEntityMapping(state, document.id),
    prefilledSchemaData: urlSchema
      ? { [urlSchema]: { schema: urlSchema } }
      : null,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
  csvContextLoader
)(EntityMappingMode);
