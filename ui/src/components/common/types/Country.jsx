import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Country as VLCountry, CountrySelect } from '@alephdata/vislib';
import { selectLocale, selectModel } from 'src/selectors';

const mapStateToProps = (state) => {
  const model = selectModel(state);
  const locale = selectLocale(state);

  return { fullList: model.types.country.values, locale };
};

class Country extends Component {
  static Name = connect(mapStateToProps)(VLCountry.Label);

  static List = connect(mapStateToProps)(VLCountry.List);

  static MultiSelect = connect(mapStateToProps)(CountrySelect);
}

export default Country;
