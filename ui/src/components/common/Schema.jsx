import 'font-awesome/css/font-awesome.min.css';

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import './Schema.css';


class SchemaIcon extends PureComponent {
  shouldComponentUpdate(nextProps) {
    return this.props.schema !== nextProps.schema;
  }

  render() {
    const {schema, schemata} = this.props,
          model = schemata[schema] || {};

    if (!model.icon) {
      return null;
    }

    return (
      <i className={`fa fa-fw ${model.icon}`}/>
    );
  }
}

class SchemaName extends PureComponent {
  shouldComponentUpdate(nextProps) {
    return this.props.schema !== nextProps.schema 
      || this.props.plural !== nextProps.plural;
  }

  render() {
    const {schema, schemata, plural} = this.props,
          model = schemata[schema] || {};
    let label = model.label || schema;
    if (plural) {
      label = model.plural || label;
    }
    return (
      <span title={label}>{label}</span>
    );
  }
}

const mapStateToProps = state => ({
  schemata: state.metadata.schemata,
});

class Schema extends PureComponent {
  static Name = connect(mapStateToProps)(SchemaName);
  static Icon = connect(mapStateToProps)(SchemaIcon);
}


export default Schema;
