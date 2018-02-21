import 'font-awesome/css/font-awesome.min.css';

import React, {Component} from 'react';
import {connect} from 'react-redux';

import './Schema.css';


class SchemaIcon extends Component {
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

class SchemaLabel extends Component {
  render() {
    const { schema, schemata, plural, icon } = this.props;
    const model = schemata[schema] || {};
    let label = model.label || schema;
    if (plural) {
      label = model.plural || label;
    }
    if (icon) {
      return (
        <span><Schema.Icon schema={schema} /> {label}</span>
      );
    }
    return (
      <span>{label}</span>
    );
  }
}

const mapStateToProps = state => ({
  schemata: state.metadata.schemata,
});

class Schema extends Component {
  static Label = connect(mapStateToProps)(SchemaLabel);
  static Icon = connect(mapStateToProps)(SchemaIcon);
}

export default Schema;
