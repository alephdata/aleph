import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import { Checkbox } from '@blueprintjs/core';
import c from 'classnames';

import {
  Country, Collection, Entity, FileSize, Date, Skeleton,
} from 'components/common';
/* eslint-disable */

class EntitySearchResultsRow extends Component {
  renderSkeleton() {
    const { hideCollection, documentMode, updateSelection, writeable } = this.props;

    return (
      <tr className={c('EntitySearchResultsRow', 'nowrap')} key="skeleton">
        {writeable && updateSelection && (
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
      selection,
      writeable,
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
    const resultClass = c('EntitySearchResultsRow', 'nowrap', { active: isActive }, { prefix: isPrefix });
    const highlightsClass = c('EntitySearchResultsRow', { active: isActive });
    const rowClass = c(resultClass, { viewed: !!entity.lastViewed });

    return (
      <>
        <tr key={entity.id} className={rowClass}>
          {writeable && updateSelection && (
            <td key="select" className="select">
              <Checkbox checked={isSelected} onChange={() => updateSelection(entity)} />
            </td>
          )}
          <td key="entity" className="entity">
            <Entity.Link
              preview={showPreview}
              documentMode={documentMode}
              entity={entity}
              icon
            />
          </td>
          {!hideCollection
            && (
              <td key="collection" className="collection">
                <Collection.Link preview collection={entity.collection} icon />
              </td>
            )
          }
          {!documentMode && (
            <td key="country" className="country">
              <Country.List codes={entity.getTypeValues('country')} />
            </td>
          )}
          <td key="date" className="date">
            <Date.Earliest values={entity.getTypeValues('date')} />
          </td>
          {documentMode && (
            <td key="file-size" className="file-size">
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

export default EntitySearchResultsRow;
