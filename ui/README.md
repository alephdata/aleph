# User Interface

This folder contains the Aleph 2 user interface, a ReactJS-based application. 

## Installation / Development

Usually, the UI will be run via the docker setup included in aleph. If you
want to execute it as a stand-alone application, run the following commands:

* `npm install`
* `npm start` - React app at [http://localhost:3000](http://localhost:3000)

Be sure to have the environment variable ``REACT_APP_API_ENDPOINT`` pointed
at an Aleph 2 instance with CORS enabled.

## Translation

We need to document this properly. 

```bash
npm run messages
npm run json2pot
tx push -s
tx pull -a
npm run po2json
```
