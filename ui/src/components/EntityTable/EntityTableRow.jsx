import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import { Checkbox } from '@blueprintjs/core';
import c from 'classnames';

import {
  Country, Collection, Entity, FileSize, Date, Skeleton,
} from 'src/components/common';
/* eslint-disable */

class EntityTableRow extends Component {
  renderSkeleton() {
    const { hideCollection, documentMode, updateSelection } = this.props;

    return (
      <tr className={c('EntityTableRow', 'nowrap')}>
        {updateSelection && (
          <td className="select">
            <Skeleton.Text type="span" length={2} />
          </td>
        )}
        <td className="entity">
          <Skeleton.Text type="span" length={30} />
        </td>
        {!hideCollection && (
          <td className="collection">
            <Skeleton.Text type="span" length={15} />
          </td>
        )}
        {!documentMode && (
          <td className="country">
            <Skeleton.Text type="span" length={15} />
          </td>
        )}
        <td className="date">
          <Skeleton.Text type="span" length={10} />
        </td>
        {documentMode && (
          <td className="file-size">
            <Skeleton.Text type="span" length={20} />
          </td>
        )}
      </tr>
    );
  }

  render() {
    const {
      entity,
      isPending,
      location,
      hideCollection,
      documentMode,
      showPreview,
      updateSelection,
      selection
    } = this.props;

    if (isPending) {
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
