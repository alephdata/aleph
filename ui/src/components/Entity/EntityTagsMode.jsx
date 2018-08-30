import React from 'react';
import queryString from 'query-string';
import { FormattedNumber, FormattedMessage } from 'react-intl';
import { connect } from "react-redux";

import { Tag } from 'src/components/common';
import { fetchEntityTags } from "src/actions";
import { selectEntityTags } from "src/selectors";

import './EntityTagsMode.css';

class EntityTagsMode extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entity, tags } = this.props;
    if (entity.id !== undefined && tags.shouldLoad) {
      this.props.fetchEntityTags(entity);
    }
  }

  getLink(tag) {
    // const { entity } = this.props;
    const key = `filter:${tag.field}`;
    // const params = {exclude: entity.id, [key]: tag.value};
    const params = {[ key ]: tag.value};
    const query = queryString.stringify(params);
    return `/search?${query}`;
  }

  render() {
    const { entity, tags } = this.props;

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
      <React.Fragment>
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
          {tags.results.map((tag, index) => (
            <tr key={index}>
              <td key={index + 1} className='entity'>
                <a href={this.getLink(tag)}>
                  <Tag.Icon field={tag.field}/>
                  {tag.value}
                </a>
              </td>
              <td key={index + 2}>
                <FormattedNumber value={tag.count}/>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  tags: selectEntityTags(state, ownProps.entity.id)
});

EntityTagsMode =  connect(mapStateToProps, { fetchEntityTags })(EntityTagsMode);
export default EntityTagsMode;
