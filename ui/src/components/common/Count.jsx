import { Count } from '/src/react-ftm/index.ts';
import { connect } from 'react-redux';

import { selectLocale } from '/src/selectors.js';
import './Count.scss';

const mapStateToProps = (state) => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(Count);
