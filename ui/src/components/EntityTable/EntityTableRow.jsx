import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import { Checkbox, Classes } from '@blueprintjs/core';
import c from 'classnames';

import {
  Country, Collection, Entity, FileSize, Date,
} from 'src/components/common';
/* eslint-disable */

class EntityTableRow extends Component {
  renderSkeleton() {
    const { hideCollection, documentMode, updateSelection } = this.props;

    console.log('in document mode', documentMode, hideCollection)
    return (
      <tr className={c('EntityTableRow', 'nowrap')}>
        {updateSelection && (
          <td className="select">
            <span className={Classes.SKELETON}>p</span>
          </td>
        )}
        <td className="entity">
          <span className={Classes.SKELETON}>placeholder</span>
        </td>
        {!hideCollection && (
          <td className="collection">
            <span className={Classes.SKELETON}>placeholder</span>
          </td>
        )}
        {!documentMode && (
          <td className="country">
            <span className={Classes.SKELETON}>placeholder</span>
          </td>
        )}
        <td className="date">
          <span className={Classes.SKELETON}>placeholder</span>
        </td>
        {documentMode && (
          <td className="file-size">
            <span className={Classes.SKELETON}>placeholder</span>
          </td>
        )}
      </tr>
    );
  }

  render() {
    const {
      entity,
      isLoading,
      location,
      hideCollection,
      documentMode,
      showPreview,
      updateSelection,
      selection
    } = this.props;

    if (isLoading) {
      return this.renderSkeleton();
    }

    const selectedIds = _.map(selection || [],
      'id');
    const isSelected = selectedIds.indexOf(entity.id) > -1;
    const parsedHash = queryString.parse(location.hash);
    const highlights = !entity.highlight ? [] : entity.highlight;
    // Select the current row if the ID of the entity matches the ID of the
    // current object being previewed. We do this so that if a link is shared
    // the currently displayed preview will also have the row it corresponds to
    // highlighted automatically.
    const isActive = parsedHash['preview:id'] && parsedHash['preview:id'] === entity.id;
    const isPrefix = !!highlights.length;
    const resultClass = c('EntityTableRow', 'nowrap', { active: isActive }, { prefix: isPrefix });
    const highlightsClass = c('EntityTableRow', { active: isActive });
    return (
      <>
        <tr key={entity.id} className={resultClass}>
          {updateSelection && (
            <td className="select">
              <Checkbox checked={isSelected} onChange={() => updateSelection(entity)} />
            </td>
          )}
          <td className="entity">
            <Entity.Link
              preview={showPreview}
              documentMode={documentMode}
              entity={entity}
              icon
            />
          </td>
          {!hideCollection
            && (
            <td className="collection">
              <Collection.Link preview collection={entity.collection} icon />
            </td>
            )
          }
          {!documentMode && (
            <td className="country">
              <Country.List codes={entity.getTypeValues('country')} />
            </td>
          )}
          <td className="date">
            <Date.Earliest values={entity.getTypeValues('date')} />
          </td>
          {documentMode && (
            <td className="file-size">
              <FileSize value={entity.getFirst('fileSize')} />
            </td>
          )}
        </tr>
        {!!highlights.length
          && (
          <tr key={`${entity.id}-hl`} className={highlightsClass}>
            <td colSpan="5" className="highlights">
              {highlights.map((phrase, index) => (
                <span key={index}>
                  <span dangerouslySetInnerHTML={{ __html: phrase }} />
…
                </span>
              ))}
            </td>
          </tr>
          )
        }
      </>
    );
  }
}

export default EntityTableRow;
