import React, {Component} from 'react';

import {Property} from 'src/components/common';
import {selectSchemata} from "../../selectors";
import {connect} from "react-redux";


class EntityInfoMode extends Component {
  render() {
    const { entity } = this.props;

    const entityProperties = entity.getProperties()
      .filter(propValue => !propValue.isEmpty())
      .filter(propValue => !propValue.property.hidden);
    return (
      <ul className="info-sheet">
        { entityProperties.map((propValue) => (
          <li key={propValue.name}>
            <span className="key">
              <Property.Name model={propValue.property} />
            </span>
            <span className="value">
              <Property.Values model={propValue} />
            </span>
          </li>
        ))}
      </ul>
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
