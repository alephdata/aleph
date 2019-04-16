import React, { Component, PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import Entity from 'src/components/common/Entity';
import {
  Numeric, Country, Language, Date, URL,
} from 'src/components/common';
import wordList from 'src/util/wordList';
import ensureArray from 'src/util/ensureArray';

import './Property.scss';

class Value extends PureComponent {
  render() {
    const { value, prop } = this.props;
    if (!value) {
      return null;
    }
    if (prop.type.name === 'country') {
      return <Country.Name code={value} />;
    }
    if (prop.type.name === 'language') {
      return <Language.Name code={value} />;
    }
    if (prop.type.name === 'url') {
      return <URL value={value} />;
    }
    if (prop.type.name === 'entity') {
      return <Entity.Link entity={value} icon />;
    }
    if (prop.type.name === 'date') {
      return <Date value={value} />;
    }
    if (prop.type.name === 'number') {
      return <Numeric num={value} />;
    }
    return value;
  }
}

class Name extends PureComponent {
  render() {
    const { prop } = this.props;
    return prop.label;
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

class Values extends PureComponent {
  render() {
    const { prop, values } = this.props;
    const vals = ensureArray(values).map(value => (
      <Value key={value.toString()} prop={prop} value={value} />
    ));
    if (!vals.length) {
      return (<span className="no-value">—</span>);
    }
    return (<span>{ wordList(vals, ' · ') }</span>);
  }
}

class Property extends Component {
    static Name = Name;

    static Reverse = Reverse;

    static Value = Value;

    static Values = Values;
}

export default Property;
