import React, { Component } from 'react';
import { connect } from 'react-redux';

import EntityReferencesTable from 'src/components/EntityScreen/EntityReferencesTable';

class EntityReferences extends Component {

  render() {
    const { entity, references } = this.props;

    if (!references || !references.results || !references.results.length) {
      return null;
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
