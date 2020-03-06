import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import fetchCsvData from 'src/util/fetchCsvData';
import { SectionLoading } from 'src/components/common';
import { showErrorToast } from 'src/app/toast';
import { fetchEntityMapping } from 'src/actions';
import { selectEntityMapping, selectModel } from 'src/selectors';
import MappingEditor from 'src/components/MappingEditor/MappingEditor';

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
      <MappingEditor
        entity={entity}
        csvData={csvData}
        csvHeader={csvHeader}
        mappingData={mappingData}
      />
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
)(EntityMappingMode);
