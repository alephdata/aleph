import React from 'react';
import { connect } from 'react-redux';
import { Property as VLProperty } from '@alephdata/react-ftm';
import { Entity } from 'components/common';

import { selectLocale } from 'selectors';

import './Property.scss';

const getEntityLink = entity => <Entity.Link entity={entity} icon />;

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

class Property {
  static Name = VLProperty.Name;

  static Reverse = connect(mapStateToProps)(VLProperty.Reverse);

  static Value = (props) => <VLProperty.Value {...props} getEntityLink={getEntityLink} />

  static Values = (props) => <VLProperty.Values {...props} getEntityLink={getEntityLink} />
}

export default Property;
