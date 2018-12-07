import React from 'react';
import {connect} from 'react-redux';

import {Entity, Schema} from 'src/components/common';
import {selectSchemata} from 'src/selectors';


class EntityHeading extends React.Component {
  render() {
    const { entity, schema } = this.props;
    if (schema === undefined) {  // entity hasn't loaded.
      return null;
    }
    const isThing = schema.extends('Thing');

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

EntityHeading = connect(mapStateToProps, {})(EntityHeading);
export default EntityHeading;
