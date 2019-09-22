import React, { Component, PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import { Value, Values } from 'src/components/Property/Value';
import { ValueLink, ValueLinks } from 'src/components/Property/Link';

import './Property.scss';

class Name extends PureComponent {
  render() {
    return this.props.prop.label;
  }
}

class Reverse extends PureComponent {
  render() {
    const { prop } = this.props;
    if (!prop.hasReverse) {
      return <FormattedMessage id="property.inverse" defaultMessage="'{label}' of …" values={prop} />;
    }
    const reverseProp = prop.getReverse();
    return reverseProp.label;
  }
}

class Property extends Component {
    static Name = Name;

    static Reverse = Reverse;

    static Value = Value;

    static Values = Values;

    static Link = ValueLink;

    static Links = ValueLinks;
}

export default Property;
