import React, { Component } from 'react';
import { connect } from 'react-redux';

import DualPane from 'src/components/common/DualPane';
import EntityReferences from './EntityReferences';
import { fetchEntityReferences } from 'src/actions/index';

class EntityContent extends Component {
  componentDidMount() {
    const { entity } = this.props;
    if (!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { entity } = this.props;

    return (
      <DualPane.ContentPane>
        <EntityReferences entity={entity} />
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    references: state.entityReferences[ownProps.entity.id],
    schema: state.metadata.schemata[ownProps.entity.schema]
  };
};

export default connect(mapStateToProps, {fetchEntityReferences})(EntityContent);