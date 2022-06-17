// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { Component } from 'react';
import { connect } from 'react-redux';
import { Language as VLLanguage, LanguageSelect } from '@alephdata/react-ftm';
import { selectLocale, selectModel } from 'selectors';

const mapStateToProps = (state) => {
  const model = selectModel(state);
  const locale = selectLocale(state);
  return { fullList: model.types.language.values, locale };
};

class Language extends Component {
  static Name = connect(mapStateToProps)(VLLanguage.Label);

  static List = connect(mapStateToProps)(VLLanguage.List);

  static MultiSelect = connect(mapStateToProps)(LanguageSelect);
}

export default Language;
