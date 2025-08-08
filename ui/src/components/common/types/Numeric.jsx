import { Numeric } from '/src/react-ftm/index.ts';
import { connect } from 'react-redux';

import { selectLocale } from '/src/selectors.js';

const mapStateToProps = (state) => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(Numeric);
