import { Component } from 'react';
import { connect } from 'react-redux';
import { Language as VLLanguage, LanguageSelect } from 'react-ftm';
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
