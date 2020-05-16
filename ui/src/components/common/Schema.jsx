import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectModel } from 'src/selectors';
import { Schema as VLSchema, SchemaSelect } from '@alephdata/vislib';

function SchemaLink(props) {
  const { schema, plural, url, children } = props;
  return (
    <Link to={url}>
      <VLSchema.Label schema={schema} icon={true} plural={plural} />
      {children}
    </Link>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { schema } = ownProps;
  return { schema: selectModel(state).getSchema(schema) };
};

class Schema extends Component {
  static Label = connect(mapStateToProps)(VLSchema.Label);

  static Icon = connect(mapStateToProps)(VLSchema.Icon);

  static Link = connect(mapStateToProps)(SchemaLink);

  static Select = connect(state => ({ model: selectModel(state)}))(SchemaSelect);
}

export default Schema;
