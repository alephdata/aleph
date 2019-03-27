import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import Entity from 'src/components/common/Entity';
import {
  Numeric, Country, Date, URL,
} from 'src/components/common';
import { selectModel } from 'src/selectors';
import wordList from 'src/util/wordList';
import ensureArray from 'src/util/ensureArray';

import './Property.scss';

class Value extends PureComponent {
  render() {
    const { value, prop } = this.props;
    if (!value) {
      return null;
    }
    if (prop.type === 'country') {
      return <Country.Name code={value} />;
    }
    if (prop.type === 'url') {
      return <URL value={value} />;
    }
    if (prop.type === 'entity') {
      return <Entity.Smart.Link entity={value} icon />;
    }
    if (prop.type === 'date') {
      return <Date value={value} />;
    }
    if (prop.type === 'number') {
      return <Numeric num={value} />;
    }
    return value;
  }
}

class Name extends PureComponent {
  render() {
    const { name, prop } = this.props;
    return (<span>{prop.label || name}</span>);
  }
}

class Reverse extends PureComponent {
  render() {
    const { prop, model } = this.props;
    if (!prop.range || !prop.reverse) {
      return <FormattedMessage id="property.inverse" defaultMessage="'{name}' of …" values={prop} />;
    }
    const range = model.getSchema(prop.range);
    const reverseProp = range.getProperty(prop.reverse);
    return <span>{reverseProp.plural || reverseProp.label}</span>;
  }
}

class Values extends PureComponent {
  render() {
    const { prop, values = prop.values } = this.props;
    const vals = ensureArray(values).map(value => (
      <Value key={value.toString()} prop={prop.property} value={value} />
    ));
    if (!vals.length) {
      return (<span className="no-value">—</span>);
    }
    return (<span>{ wordList(vals, ' · ') }</span>);
  }
}

const mapStateToProps = state => ({
  model: selectModel(state),
});

class Property extends Component {
    static Name = Name;

    static Reverse = connect(mapStateToProps)(Reverse);

    static Value = Value;

    static Values = Values;
}

export default Property;
