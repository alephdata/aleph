import { connect } from 'react-redux';
import { Property as VLProperty } from '@alephdata/vislib';

import { selectLocale } from 'src/selectors';

import './Property.scss';

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

class Property extends VLProperty {
  static Reverse = connect(mapStateToProps)(super.Reverse);
}

export default Property;
