import 'font-awesome/css/font-awesome.min.css';

import React, { Component } from 'react';
import { connect } from 'react-redux';


class SchemaIcon extends Component {
  render() {
    const { schema, schemata } = this.props,
          model = schemata[schema] || {},
          icon = model.icon || 'fa-bath';
    return (
      <i className={ `fa ${ icon }` }></i>
    );
  }
}

class SchemaName extends Component {
  render() {
    const { schema, schemata } = this.props,
          model = schemata[schema] || {},
          label = model.label || schema;
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
