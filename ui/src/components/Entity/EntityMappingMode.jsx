import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import fetchCsvData from 'src/util/fetchCsvData';
import { SectionLoading } from 'src/components/common';
import { fetchEntityMapping } from 'src/actions';
import { selectEntityMapping } from 'src/selectors';
import { MappingEditor, MappingImportButton, MappingStatus } from 'src/components/MappingEditor/.';

import './EntityMappingMode.scss';

export class EntityMappingMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      csvHeader: null,
      csvData: null,
      importedMappingData: null,
    };

    this.processCsvResults = this.processCsvResults.bind(this);
    this.onImport = this.onImport.bind(this);
  }

  componentDidMount() {
    const { entity, existingMapping } = this.props;

    fetchCsvData(entity.links.csv, this.processCsvResults);

    if (entity.id && existingMapping.shouldLoad) {
      this.props.fetchEntityMapping(entity);
    }
  }

  onImport(mappingData) {
    const processedData = this.processImportedMappings(mappingData);

    this.setState({ importedMappingData: processedData });
  }

  processCsvResults(results, parser) {
    if (results?.data) {
      this.setState({
        csvHeader: results.data[0],
        csvData: results.data.slice(1, 15),
      });
      parser.abort();
    }
  }

  processImportedMappings(mappingData) {
    const { csvHeader } = this.state;

    const processed = {};
    Object.entries(mappingData).forEach(([id, { schema, keys, properties }]) => {
      const processedKeys = keys.filter(key => csvHeader.indexOf(key) > -1);
      const processedProps = {};

      if (properties) {
        Object.entries(properties).forEach(([propName, propVal]) => {
          if (propVal.columns || (propVal.column && csvHeader.indexOf(propVal.column) === -1)) {
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
    });

    return processed;
  }

  render() {
    const { entity, existingMapping } = this.props;
    const { csvData, csvHeader, importedMappingData } = this.state;

    if (!csvData || !csvHeader || existingMapping.isPending) {
      return <SectionLoading />;
    }

    const showImport = !existingMapping.isPending && !importedMappingData && !existingMapping.id;

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

        {showImport && (
          <MappingImportButton onImport={this.onImport} />
        )}

        {existingMapping.id && (
          <MappingStatus
            mapping={existingMapping}
          />
        )}
        <MappingEditor
          entity={entity}
          csvData={csvData}
          csvHeader={csvHeader}
          mappingData={importedMappingData || existingMapping?.query}
          existingMappingMetadata={existingMapping}
        />
      </div>
    );
  }
}

const mapDispatchToProps = { fetchEntityMapping };

const mapStateToProps = (state, ownProps) => {
  const { entity } = ownProps;

  return {
    existingMapping: selectEntityMapping(state, entity.id),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityMappingMode);
