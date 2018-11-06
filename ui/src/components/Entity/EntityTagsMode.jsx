import React from 'react';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import { injectIntl, defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { connect } from "react-redux";

import { Tag } from 'src/components/common';
import { ErrorSection } from 'src/components/common';
import { selectEntityTags } from "src/selectors";

import './EntityTagsMode.scss';

const messages = defineMessages({
  no_tags: {
    id: 'entity.tags.no_tags',
    defaultMessage: 'No connections.',
  }
});


class EntityTagsMode extends React.Component {

  getLink(tag) {
    // const { entity } = this.props;
    const key = `filter:${tag.field}`;
    // const params = {exclude: entity.id, [key]: tag.value};
    const params = {[ key ]: tag.value};
    const query = queryString.stringify(params);
    return `/search?${query}`;
  }

  render() {
    const { intl, entity, tags } = this.props;

    if (!tags || !entity.links || !tags.results || tags.results.length === 0) {
      return <ErrorSection visual='tag'
                           title={intl.formatMessage(messages.no_tags)} />
    }

    return (
      <React.Fragment>
        <table className="data-table">
          <thead>
          <tr>
            <th className="entity">
              <span className="value">
                 <FormattedMessage id="tags.title"
                                   defaultMessage="Tag" />
              </span>
            </th>
            <th className="numeric">
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
              <td key={index + 1} className="entity">
                <Link to={this.getLink(tag)}>
                  <Tag.Icon field={tag.field}/>
                  {tag.value}
                </Link>
              </td>
              <td key={index + 2} className="numeric">
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

EntityTagsMode = injectIntl(EntityTagsMode);
EntityTagsMode =  connect(mapStateToProps, {})(EntityTagsMode);
export default EntityTagsMode;
