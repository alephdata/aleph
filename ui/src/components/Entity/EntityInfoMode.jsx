import React, {Component} from 'react';
import {FormattedMessage} from "react-intl";
import {Property} from 'src/components/common';




class EntityInfoMode extends Component {
  render() {
    const { entity } = this.props;

    const entityProperties = entity.getProperties()
      .filter(propValue => !propValue.isEmpty())
      .filter(propValue => !propValue.property.hidden);

    return (entityProperties.length ? <ul className="info-sheet">
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
    </ul> : <span className="bp3-text-large bp3-text-muted">
        <FormattedMessage id="infoMode.noProperty"
                          defaultMessage="No data available :("/>
      </span>
    );
  }
}


export default EntityInfoMode;
