import 'font-awesome/css/font-awesome.min.css';

import React, {Component} from 'react';
import {connect} from 'react-redux';
import { Link } from 'react-router-dom';
import { selectMetadata } from 'src/selectors';

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
        <span><Schema.Icon schema={schema}/> {label}</span>
      );
    }
    return label;
  }
}

class SchemaLink extends Component {
  render() {
    const { schema, plural, url } = this.props;
    return (
        <React.Fragment>
            <Schema.Icon schema={schema}/>
            <Link to={url}>
                <Schema.Label schema={schema} icon={false} plural={plural}/>
            </Link>
        </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  schemata: selectMetadata(state).schemata,
});

class Schema extends Component {
  static Label = connect(mapStateToProps)(SchemaLabel);
  static Icon = connect(mapStateToProps)(SchemaIcon);
  static Link = connect(mapStateToProps)(SchemaLink);
}

export default Schema;
