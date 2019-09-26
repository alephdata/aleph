import React, { PureComponent } from 'react';

import Entity from 'src/components/common/Entity';
import {
  Numeric, Country, Language, Date, FileSize, URL,
} from 'src/components/common';
import wordList from 'src/util/wordList';
import ensureArray from 'src/util/ensureArray';


export class Value extends PureComponent {
  render() {
    const { value, prop } = this.props;
    if (!value) {
      return null;
    }
    if (prop.name === 'fileSize') {
      return <FileSize value={value} />;
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

export class Values extends PureComponent {
  render() {
    const { prop, values, separator = ' · ', missing = '—' } = this.props;
    const vals = ensureArray(values).map(value => (
      <Value key={value.id || value} prop={prop} value={value} {...this.props} />
    ));
    if (!vals.length) {
      return (<span className="no-value">{missing}</span>);
    }
    return (<span>{ wordList(vals, separator) }</span>);
  }
}
