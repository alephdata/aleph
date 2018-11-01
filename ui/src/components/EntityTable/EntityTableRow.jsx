import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import { Checkbox } from '@blueprintjs/core';

import { Country, Schema, Collection, Entity, FileSize, Date } from 'src/components/common';

class EntityTableRow extends Component {
  constructor(props) {
    super(props)
  }

  static splitHighlight(split, givenHighlights) {
    const highlightArray = givenHighlights.split(split);
    let highlights = highlightArray.join('');

    return highlights;
  }

  static getHighlight(highlight) {
    let highlightArray = EntityTableRow.splitHighlight('<em>', highlight);

    return EntityTableRow.splitHighlight('</em>', highlightArray);
  }

  render() {
    const { entity, className, location } = this.props;
    const { hideCollection, documentMode, showPreview } = this.props;

    const { updateSelection, selection } = this.props;
    const selectedIds = _.map(selection || [], 'id');
    const isSelected = selectedIds.indexOf(entity.id) > -1;
    const getHighlight = this.constructor.getHighlight;

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
      <React.Fragment>
      <tr className={rowClassName} key={entity.id}>
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
    {entity.highlight !== undefined && entity.highlight.map(function(sentence, index){
      return entity.name !== getHighlight(sentence) && <tr key={sentence}>
        <td key={sentence} colSpan="5" className={index !== (entity.highlight.length - 1) ? 'highlighted-words' : ''}>
          <React.Fragment>
            <span dangerouslySetInnerHTML={{__html: sentence}} />...
          </React.Fragment>
        </td>
      </tr>
    })}
      </React.Fragment>
    );
  }
}

export default EntityTableRow;
