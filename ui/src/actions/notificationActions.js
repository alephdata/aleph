// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryNotifications = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_NOTIFCATIONS' });
