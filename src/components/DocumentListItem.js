import React from 'react'

const DocumentListItem = (doc) => (
  <tr>
    <td>{doc.title}</td>
    <td>{doc.schema}</td>
  </tr>
)

export default DocumentListItem;
