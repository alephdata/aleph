import React from 'react'

const EntityListItem = (entity) => (
  <tr>
    <td>{entity.name}</td>
    <td>{entity.schema}</td>
  </tr>
)

export default EntityListItem;
