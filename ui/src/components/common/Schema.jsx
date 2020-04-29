import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectModel } from 'src/selectors';
import { Icon } from '@blueprintjs/core';


class SchemaIcon extends PureComponent {
  render() {
    const { schema, className } = this.props;

    return <Icon iconSize="16px" icon={schema.name.toLowerCase()} className={className} />;
  }
}

class SchemaLabel extends Component {
  render() {
    const { schema, plural = false, icon } = this.props;
    const label = plural ? schema.plural : schema.label;
    if (icon) {
      return (
        <>
          <Schema.Icon schema={schema} className="left-icon" />
          {label}
        </>
      );
    }
    return label;
  }
}

function SchemaLink(props) {
  const { schema, plural, url, children } = props;
  return (
    <Link to={url}>
      <Schema.Icon schema={schema} className="left-icon" />
      <Schema.Label schema={schema} icon={false} plural={plural} />
      {children}
    </Link>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { schema } = ownProps;
  return { schema: selectModel(state).getSchema(schema) };
};

class Schema extends Component {
  static Label = connect(mapStateToProps)(SchemaLabel);

  static Icon = connect(mapStateToProps)(SchemaIcon);

  static Link = connect(mapStateToProps)(SchemaLink);
}

export default Schema;
