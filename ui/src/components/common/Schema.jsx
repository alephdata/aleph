import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectModel } from 'src/selectors';
import { Icon } from './Icon';

class SchemaIcon extends PureComponent {
  render() {
    const { schema, ...rest } = this.props;
    return (
      <Icon
        className="entity-icon"
        iconSize="16px"
        {...rest}
        name={schema.name.toLowerCase()}
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
          <Schema.Icon schema={schema} />
          {label}
        </span>
      );
    }
    return label;
  }
}

function SchemaLink(props) {
  const { schema, plural, url } = props;
  return (
    <React.Fragment>
      <Schema.Icon schema={schema} />
      <Link to={url}>
        <Schema.Label schema={schema} icon={false} plural={plural} />
      </Link>
    </React.Fragment>
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
    Label: connect(mapStateToProps)(SmartSchemaHOC(SchemaLabel)),
    Icon: connect(mapStateToProps)(SmartSchemaHOC(SchemaIcon)),
    Link: connect(mapStateToProps)(SmartSchemaHOC(SchemaLink)),
  };

  static Label = SchemaLabel;

  static Icon = SchemaIcon;

  static Link = SchemaLink;
}

export default Schema;
