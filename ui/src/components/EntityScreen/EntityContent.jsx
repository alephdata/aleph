import React, { Component } from 'react';
import { connect } from 'react-redux';

import Entity from './Entity';
import DualPane from 'src/components/common/DualPane';
import Schema from 'src/components/common/Schema';
import EntityReferences from './EntityReferences';
import { fetchEntityReferences } from '../../actions/index';

import './EntityContent.css';

class EntityContent extends Component {
  componentDidMount() {
    const { entity } = this.props;
    if(!this.props.references && entity && entity.id) {
      this.props.fetchEntityReferences(entity);
    }
  }

  render() {
    const { entity } = this.props;

    return (
      <DualPane.ContentPane style={{padding: 0}}>
        <div className="content-pane-outer">
          <div className="content-pane-inner EntityContent">
            <div className="EntitySummary">
              <span className="pt-text-muted">
                <Schema.Label schema={entity.schema} icon={true} />
              </span>
              <h1>
                <Entity.Label entity={entity} addClass={true}/>
              </h1>
            </div>
            <EntityReferences entity={entity} />
          </div>
        </div>
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