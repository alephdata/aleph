import 'font-awesome/css/font-awesome.min.css';

import React, { Component } from 'react';
import { connect } from 'react-redux';


class SchemaIcon extends Component {
  render() {
    const { schema, schemata } = this.props,
          model = schemata[schema] || {},
          icon = model.icon || 'fa-magic';
    return (
      <i className={ `fa fa-fw ${ icon }` }></i>
    );
  }
}

class SchemaName extends Component {
  render() {
    const { schema, schemata, plural } = this.props,
          model = schemata[schema] || {};
    let label = model.label || schema;
    if (plural) {
      label = model.plural || label;
    }
    return (
      <span>{ label }</span>
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
