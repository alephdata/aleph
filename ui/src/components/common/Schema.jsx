import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectModel } from 'src/selectors';
import { Icon } from '@blueprintjs/core';

class SchemaIcon extends PureComponent {
  render() {
    const { schema, ...rest } = this.props;
    return (
      <Icon
        iconSize="16px"
        {...rest}
        icon={schema.name.toLowerCase()}
      />
    );
  }
}

class SchemaLabel extends Component {
  render() {
    const { schema, plural = false, icon } = this.props;
    const label = plural ? schema.plural : schema.label;
    if (icon) {
      return (
        <span>
          <Schema.Icon schema={schema} className="left-icon" />
          {label}
        </span>
      );
    }
    return label;
  }
}

function SchemaLink(props) {
  const { schema, plural, url, children } = props;
  return (
    <>
      <Link to={url}>
        <Schema.Icon schema={schema} className="left-icon" />
        <Schema.Label schema={schema} icon={false} plural={plural} />
        {children}
      </Link>
    </>
  );
}

function SmartSchemaHOC(InnerComponent) {
  return function SmartSchemaComponent(props) {
    const {
      model, schema: schemaName,
      /* omit */ dispatch,
      ...rest
    } = props;
    const schema = model.getSchema(schemaName);
    return (<InnerComponent schema={schema} {...rest} />
    );
  };
}

const mapStateToProps = state => ({
  model: selectModel(state),
});

class Schema extends Component {
  static Smart = {
    Icon: connect(mapStateToProps)(SmartSchemaHOC(SchemaIcon)),
    Label: connect(mapStateToProps)(SmartSchemaHOC(SchemaLabel)),
    Link: connect(mapStateToProps)(SmartSchemaHOC(SchemaLink)),
  };

  static Label = SchemaLabel;

  static Icon = SchemaIcon;

  static Link = SchemaLink;
}

export default Schema;
