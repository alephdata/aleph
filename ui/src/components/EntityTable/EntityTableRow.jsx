import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import { Checkbox } from '@blueprintjs/core';

import { Country, Schema, Collection, Entity, FileSize, Date } from 'src/components/common';

class EntityTableRow extends Component {

  render() {
    const { entity, className, location } = this.props;
    const { hideCollection, documentMode, showPreview } = this.props;

    const { updateSelection, selection } = this.props;
    const selectedIds = _.map(selection || [], 'id');
    const isSelected = selectedIds.indexOf(entity.id) > -1;
    
    const parsedHash = queryString.parse(location.hash);
    let rowClassName = (className) ? `${className} nowrap` : 'nowrap';

    // Select the current row if the ID of the entity matches the ID of the
    // current object being previewed. We do this so that if a link is shared
    // the currently displayed preview will also have the row it corresponds to
    // highlighted automatically.
    if (parsedHash['preview:id'] && parsedHash['preview:id'] === entity.id) {
      rowClassName += ' active'
    }
    
    return (
      <tr className={rowClassName} key={entity.id}>
        {updateSelection && <td className="select" key={entity.id +1}>
          <Checkbox checked={isSelected} onChange={() => updateSelection(entity)} />
        </td>}
        <td className="entity" key={entity.id +2}>
          <Entity.Link preview={showPreview}
                       documentMode={documentMode}
                       entity={entity} icon />
        </td>
        {!hideCollection && 
          <td className="collection" key={entity.id +3}>
            <Collection.Link preview={true} collection={entity.collection} icon />
          </td>
        }
        <td className="schema" key={entity.id +4}>
          <Schema.Label schema={entity.schema} />
        </td>
        {!documentMode && (
          <td className="country" key={entity.id +5}>
            <Country.List codes={entity.countries} />
          </td>
        )}
        <td className="date" key={entity.id +6}>
          <Date.Earliest values={entity.dates} />
        </td>
        {documentMode && (
          <td className="file-size" key={entity.id +7}>
            <FileSize value={entity.file_size}/>
          </td>
        )}
      </tr>
    );
  }
}

export default EntityTableRow;
