import React from 'react';

import './SchemaIcon.css';

export default ({ schemaId }) => (
  <span className={`schema-icon schema-icon--${schemaId}`}></span>
);
