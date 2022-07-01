import { Numeric } from '@alephdata/react-ftm';
import { connect } from 'react-redux';

import { selectLocale } from 'selectors';

const mapStateToProps = (state) => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(Numeric);
