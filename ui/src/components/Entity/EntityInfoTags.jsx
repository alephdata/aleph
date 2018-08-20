import React from 'react';
import queryString from 'query-string';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import { Tag } from 'src/components/common';

import './EntityInfoTags.css';

class EntityInfoTags extends React.Component {

  getLink(tag) {
    // const { entity } = this.props;
    const key = `filter:${tag.field}`;
    // const params = {exclude: entity.id, [key]: tag.value};
    const params = {[ key ]: tag.value};
    const query = queryString.stringify(params);
    return `/search?${query}`;
  }

  render() {
    const {tags, entity} = this.props;

    if (!tags || !entity.links || !tags.results || tags.results.length === 0) {
      return (
        <React.Fragment>
          <span className="tags">
          <FormattedMessage id='entity.info.tags' defaultMessage='Tags'/>
                          </span>
          <p className="pt-text-muted">
            <FormattedMessage
              id="entity.info.tags.empty_description"
              defaultMessage="No tags found."/>
          </p>
        </React.Fragment>
      );
    }

    return (
      <section className="EntityInfoTags">
        <table className="data-table">
          <thead>
          <tr>
            <th className='entity'>
              <span className="value">
                 <FormattedMessage id="tags.selector"
                                   defaultMessage="Selector" />
              </span>
            </th>
            <th>
              <span className="value">
                <FormattedMessage id="tags.results"
                                  defaultMessage="Results" />
              </span>
            </th>
          </tr>
          </thead>
          <tbody>
          {tags.results.map((tag) => (
            <tr key={entity.id}>
              <td key={tag.id} className='entity'>
                <a href={this.getLink(tag)}>
                  <Tag.Icon field={tag.field}/>
                  {tag.value}
                </a>
              </td>
              <td key={tag.id}>
                <FormattedNumber value={tag.count}/>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>
    );
  }
}

export default EntityInfoTags;
