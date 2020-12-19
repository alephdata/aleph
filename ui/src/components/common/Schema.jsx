import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectModel } from 'selectors';
import { Schema as VLSchema, SchemaSelect } from '@alephdata/react-ftm';

function SchemaLink(props) {
  const { schema, plural, url, children } = props;
  return (
    <Link to={url}>
      <VLSchema.Label schema={schema} icon={true} plural={plural} />
      {children}
    </Link>
  );
}

const SchemaDescription = ({ schema }) => {
  return schema.description;
}

const mapStateToProps = (state, ownProps) => {
  const { schema } = ownProps;
  return { schema: selectModel(state).getSchema(schema) };
};

class Schema extends Component {
  static Label = connect(mapStateToProps)(VLSchema.Label);

  static Icon = connect(mapStateToProps)(VLSchema.Icon);

  static Link = connect(mapStateToProps)(SchemaLink);

  static Description = connect(mapStateToProps)(SchemaDescription);

  static Select = connect(state => ({ model: selectModel(state)}))(SchemaSelect);
}

export default Schema;
