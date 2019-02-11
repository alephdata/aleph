import React from 'react';
import {connect} from 'react-redux';

import {Entity, Schema} from 'src/components/common';
import {selectSchemata} from 'src/selectors';


class EntityHeading extends React.Component {
  render() {
    const { entity} = this.props;
    const isThing = entity.schema.isThing();

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


export default EntityHeading;
