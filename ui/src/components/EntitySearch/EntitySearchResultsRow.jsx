import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { Checkbox } from '@blueprintjs/core';
import c from 'classnames';

import { selectModel } from 'selectors';
import {
  Collection, Entity, FileSize, Property, Schema, Skeleton,
} from 'components/common';

class EntitySearchResultsRow extends Component {
  renderSkeleton() {
    const { columns, updateSelection, writeable } = this.props;

    return (
      <tr className={c('EntitySearchResultsRow', 'nowrap', 'skeleton')}>
        {writeable && updateSelection && (
          <td className="select">
            <Skeleton.Text type="span" length={2} />
          </td>
        )}
        {columns.map(({ name, type }) => (
          <td key={name} className={type?.name || name}>
            <Skeleton.Text type="span" length={name === 'caption' || name === 'collection_id' ? 30 : 15} />
          </td>
        ))}
      </tr>
    );
  }

  renderCellContent(column) {
    const { entity, model, showPreview } = this.props;
    const { isProperty, name, type } = column;

    if (name === 'caption') {
      return <Entity.Link preview={showPreview} entity={entity} icon />
    } else if (name === 'collection_id') {
      return <Collection.Link preview collection={entity.collection} icon truncate={30} />
    } else if (name === 'schema') {
      return <Schema.Label schema={entity.schema} icon />
    } else if (name === 'fileSize') {
      return <FileSize value={entity.getFirst('fileSize')} />;
    } else if (isProperty) {
      return <Property.Values prop={{ name, type: { name: type, values: model.types[type]?.values }}} values={entity.getProperty(name)} missing="-" truncate={1} truncateItem={30} />
    } else {
      let key;
      switch(name) {
        case 'countries': key = 'country'; break;
        case 'dates': key = 'date'; break;
        case 'languages': key = 'language'; break;
        case 'names': key = 'name'; break;
        case 'phones': key = 'phone'; break;
        case 'addresses': key = 'address'; break;
        case 'emails': key = 'email'; break;
        case 'mimetypes': key = 'mimetype'; break;
        default: return null;
      }
      const values = entity.getTypeValues(key);
      return <Property.Values prop={{ type: { name: key, values: model.types[key]?.values }}} values={values} missing="-" truncate={1} truncateItem={30} />
    }
  }

  render() {
    const {
      entity,
      isPending,
      location,
      columns,
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
    const resultClass = c('EntitySearchResultsRow', { active: isActive }, { prefix: isPrefix });
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
              <td colSpan="100%" className="highlights">
                <div className="highlights__content">
                  {highlights.map((phrase, index) => (
                    <span key={index}>
                      <span dangerouslySetInnerHTML={{ __html: phrase }} />
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          )
        }
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const model = selectModel(state);
  return { model };
};

export default connect(mapStateToProps)(EntitySearchResultsRow);
