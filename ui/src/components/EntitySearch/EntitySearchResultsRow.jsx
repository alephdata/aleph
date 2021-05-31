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
    const { columns, updateSelection, writeable } = this.props;

    return (
      <tr className={c('EntitySearchResultsRow', 'nowrap', 'skeleton')} key="skeleton">
        {writeable && updateSelection && (
          <td className="select">
            <Skeleton.Text type="span" length={2} />
          </td>
        )}
        {columns.map(column => (
          <td key={column} className={column.type?.name || column.name}>
            <Skeleton.Text type="span" length={column.name === 'caption' || column.name === 'collection_id' ? 30 : 15} />
          </td>
        ))}
      </tr>
    );
  }

  renderCellContent(column) {
    const { entity, showPreview } = this.props;

    if (!column.isProperty) {
      switch(column.name) {
        case 'caption':
          return <Entity.Link preview={showPreview} entity={entity} icon />
        case 'collection_id':
          return <Collection.Link preview collection={entity.collection} icon />
        case 'countries':
          return <Country.List codes={entity.getTypeValues('country')} />;
        case 'dates':
          return <Date.Earliest values={entity.getTypeValues('date')} />;
      }
    } else {
      if (column.name === 'fileSize') {
        return <FileSize value={entity.getFirst('fileSize')} />;
      } else {
        return entity.getProperty(field);
      }
    }
  }

  render() {
    const {
      entity,
      isPending,
      location,
      columns,
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

    return (
      <>
        <tr key={entity.id} className={resultClass}>
          {writeable && updateSelection && (
            <td key="select" className="select">
              <Checkbox checked={isSelected} onChange={() => updateSelection(entity)} />
            </td>
          )}
          {columns.map(column => {
            const content = this.renderCellContent(column);
            return <td key={column.name} className={column.type?.name || column.name}>{content}</td>
          })}
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
