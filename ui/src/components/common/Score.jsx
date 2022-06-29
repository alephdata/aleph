{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React, { PureComponent } from 'react';
import { FormattedNumber } from 'react-intl';


export default class Score extends PureComponent {
    render() {
        const { score } = this.props;
        return <FormattedNumber value={parseInt(parseFloat(score) * 100, 10)} />
    }
}
