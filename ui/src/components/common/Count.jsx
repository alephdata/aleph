{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import { Count } from '@alephdata/react-ftm';
import { connect } from 'react-redux';

import { selectLocale } from 'selectors';
import './Count.scss';

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(Count);
