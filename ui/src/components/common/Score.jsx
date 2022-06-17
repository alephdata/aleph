// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { FormattedNumber } from 'react-intl';


export default class Score extends PureComponent {
    render() {
        const { score } = this.props;
        return <FormattedNumber value={parseInt(parseFloat(score) * 100, 10)} />
    }
}
