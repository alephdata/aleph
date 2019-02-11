import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import { Checkbox } from '@blueprintjs/core';
import c from 'classnames';

import { Country, Schema, Collection, Entity, FileSize, Date } from 'src/components/common';

class EntityTableRow extends Component {
  render() {
    const { entity, className, location } = this.props;
    const { hideCollection, documentMode, showPreview } = this.props;

    const { updateSelection, selection } = this.props;
    const selectedIds = _.map(selection || [], 'id');
    const isSelected = selectedIds.indexOf(entity.id) > -1;
    const parsedHash = queryString.parse(location.hash);
    const highlights = !entity.highlight ? [] : entity.highlight;
    // Select the current row if the ID of the entity matches the ID of the
    // current object being previewed. We do this so that if a link is shared
    // the currently displayed preview will also have the row it corresponds to
    // highlighted automatically.
    const isActive = parsedHash['preview:id'] && parsedHash['preview:id'] === entity.id;
    const isPrefix = !!highlights.length;
    return (
      <React.Fragment>
        <tr key={entity.id}
            className={c('EntityTableRow', 'nowrap', className, {'active': isActive}, {'prefix': isPrefix})}>
          {updateSelection && <td className="select">
            <Checkbox checked={isSelected} onChange={() => updateSelection(entity)} />
          </td>}
          <td className="entity">
            <Entity.Link preview={showPreview}
                        documentMode={documentMode}
                        entity={entity} icon />
          </td>
          {!hideCollection && 
            <td className="collection">
              <Collection.Link preview={true} collection={entity.collection} icon />
            </td>
          }
          <td className="schema">
            <Schema.Label schema={entity.schema} />
          </td>
          {!documentMode && (
            <td className="country">
              <Country.List codes={entity.countries} />
            </td>
          )}
          <td className="date">
            <Date.Earliest values={entity.dates} />
          </td>
          {documentMode && (
            <td className="file-size">
              <FileSize value={entity.file_size}/>
            </td>
          )}
        </tr>
        {!!highlights.length &&
          <tr key={entity.id + '-hl'}
              className={c('EntityTableRow', className, {'active': isActive})}>
            <td colSpan="5" className="highlights">
              {highlights.map((phrase, index) =>
                <span key={index}>
                  <span dangerouslySetInnerHTML={{__html: phrase}} />…
                </span>
              )}
            </td>
          </tr>
        }
      </React.Fragment>
    );
  }
}

export default EntityTableRow;
