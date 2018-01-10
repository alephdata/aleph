import 'font-awesome/css/font-awesome.min.css';

import React, { Component } from 'react';
import { connect } from 'react-redux';

import './Schema.css';


class SchemaIcon extends Component {
  render() {
    const { schema, schemata, className } = this.props,
          model = schemata[schema] || {},
          icon = model.icon || 'fa-magic';
      const iconClass = className ? className : '';

    return (
      <i className={ `fa fa-fw ${ icon } ${ iconClass }` }></i>
    );
  }
}

class SchemaName extends Component {
  render() {
    const { schema, schemata, plural, className } = this.props,
          model = schemata[schema] || {};
    let classN = ''
    let label = model.label || schema;
    if (plural) {
      label = model.plural || label;
    }
    if(className) classN = className;
    return (
      <span className={classN}>{ label }</span>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps,
    schemata: state.metadata.schemata
  };
}

class Schema extends Component {
  static Name = connect(mapStateToProps)(SchemaName);
  static Icon = connect(mapStateToProps)(SchemaIcon);
}


export default Schema;
