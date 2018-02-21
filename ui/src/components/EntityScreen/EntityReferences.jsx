import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import EntityReferencesTable from 'src/components/EntityScreen/EntityReferencesTable';

class EntityReferences extends React.Component {

  render() {
    const { entity, references } = this.props;

    if (!references || references.isFetching) {
      return null;
    }

    if (!references.results.length) {
      return (
        <React.Fragment>
          <h2>
            <FormattedMessage 
              id="entity.references.title"
              defaultMessage="Relationships"/>
          </h2>
          <p className="muted">
            <FormattedMessage 
              id="entity.references.empty.description"
              defaultMessage="There are no known relationships."/>
          </p>
        </React.Fragment>
      );
    }
  
    return (
      <section>
        { references.results.map(ref => (
          <EntityReferencesTable key={ref.property.qname}
                                 entity={entity}
                                 schema={ref.schema}
                                 property={ref.property} />
        ))}
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const references = state.entityReferences[ownProps.entity.id];
  return {references};
};

export default connect(mapStateToProps, {})(EntityReferences);

/*
        <section className="PartialError">
          <div className="pt-non-ideal-state">
            <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
              <span className="pt-icon pt-icon-link"></span>
            </div>
            <h4 className="pt-non-ideal-state-title">
              <FormattedMessage id="entity.references.empty"
                                defaultMessage="No relationships"/>
            </h4>
            <div className="pt-non-ideal-state-description">
              <FormattedMessage id="entity.references.empty.description"
                                defaultMessage="Not currently related to other entities or documents."/>
            </div>
          </div>
        </section>
*/