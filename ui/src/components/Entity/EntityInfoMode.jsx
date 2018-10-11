import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { Property, Entity, Schema } from 'src/components/common';
import { selectSchemata } from 'src/selectors';


class EntityInfoMode extends React.Component {
  render() {
    const { entity, schema } = this.props;
    const isThing = entity && entity.schemata && entity.schemata.indexOf('Thing') !== -1;

    if (schema === undefined) {  // entity hasn't loaded.
      return null;
    }
    return (
      <React.Fragment>
        <div className="pane-heading">
          <span>
            <Schema.Label schema={entity.schema} icon={true} />
          </span>
          <h1>
            {isThing && (
              <Entity.Label entity={entity} addClass={true}/>
            )}
          </h1>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity } = ownProps;
  return {
    schema: selectSchemata(state)[entity.schema]
  };
};

EntityInfoMode = connect(mapStateToProps, {})(EntityInfoMode);
export default EntityInfoMode;
