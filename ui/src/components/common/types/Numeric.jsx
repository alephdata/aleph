{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import { Numeric } from '@alephdata/react-ftm';
import { connect } from 'react-redux';

import { selectLocale } from 'selectors';

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(Numeric);
