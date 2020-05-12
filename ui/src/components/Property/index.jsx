import React, { Component, PureComponent } from 'react';
import { connect } from 'react-redux';
import { Property as VLProperty } from '@alephdata/vislib';

import { selectLocale } from 'src/selectors';
import { ValueLink, ValueLinks } from 'src/components/Property/Link';

import './Property.scss';

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

class Property extends VLProperty {
  static Reverse = connect(mapStateToProps)(super.Reverse);

  static Link = ValueLink;

  static Links = ValueLinks;
}

export default Property;
