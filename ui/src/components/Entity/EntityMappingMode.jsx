import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import fetchCsvData from 'src/util/fetchCsvData';
import { SectionLoading } from 'src/components/common';
import { showErrorToast } from 'src/app/toast';
import { fetchEntityMapping } from 'src/actions';
import { selectEntityMapping } from 'src/selectors';
import { MappingEditor, MappingStatus } from 'src/components/MappingEditor/.';

import './EntityMappingMode.scss';

export class EntityMappingMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      csvData: null,
    };

    this.processCsvResults = this.processCsvResults.bind(this);
  }

  componentDidMount() {
    const { entity, mappingData } = this.props;

    fetchCsvData(entity.links.csv, this.processCsvResults);

    if (entity.id && mappingData.shouldLoad) {
      this.props.fetchEntityMapping(entity);
    }
  }

  processCsvResults(results, parser) {
    this.setState({
      csvHeader: results.data[0],
      csvData: results.data.slice(1, 15),
    });
    parser.abort();
  }

  render() {
    const { entity, model, mappingData } = this.props;
    const { mappings, csvData, csvHeader } = this.state;

    if (!csvData || !csvHeader || mappingData.isLoading) {
      return <SectionLoading />;
    }

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
        {mappingData.id && (
          <MappingStatus
            mapping={mappingData}
          />
        )}
        <MappingEditor
          entity={entity}
          csvData={csvData}
          csvHeader={csvHeader}
          mappingData={mappingData}
        />
      </div>
    );
  }
}

const mapDispatchToProps = { fetchEntityMapping };

const mapStateToProps = (state, ownProps) => {
  const { entity } = ownProps;

  return {
    mappingData: selectEntityMapping(state, entity.id),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityMappingMode);
