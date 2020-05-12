import { Count } from '@alephdata/vislib';
import { connect } from 'react-redux';

import { selectLocale } from 'src/selectors';

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(Count);
