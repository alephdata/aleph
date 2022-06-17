<!--
SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc

SPDX-License-Identifier: MIT
-->

# User Interface

This folder contains the Aleph user interface, a ReactJS-based application. 

## Installation / Development

Usually, the UI will be run via the docker setup included in aleph. If you
want to execute it as a stand-alone application, run the following commands:

* `npm install`
* `npm start` - React app at [http://localhost:3000](http://localhost:3000)

Be sure to have the environment variable ``REACT_APP_API_ENDPOINT`` pointed
at an Aleph 2 instance with CORS enabled. To do this, you can create a `.env`
file in the root of the ui folder that contains something like the following:

  REACT_APP_API_ENDPOINT=http://localhost:5000/api/2

## Translation

We need to document this properly. 

```bash
npm run messages
npm run json2pot
tx push -s
tx pull -a
npm run po2json
```
