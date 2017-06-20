import React from 'react'

const Document = (doc) => (
  <li>
    <strong>{doc.title || doc.name}</strong>
    <code>{doc.file_name}</code>
    <code>{doc.schema}</code>
  </li>
)

export default Document;
