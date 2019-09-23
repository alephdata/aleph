import React from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  defineMessages, FormattedNumber, FormattedMessage, injectIntl,
} from 'react-intl';

import { Tag, ErrorSection } from 'src/components/common';
import { selectEntityTags } from 'src/selectors';

import './EntityTagsMode.scss';

const messages = defineMessages({
  no_tags: {
    id: 'entity.tags.no_tags',
    defaultMessage: 'No tags found for this entity.',
  },
});


class EntityTagsMode extends React.Component {
  getLink = (tag) => {
    // const { entity } = this.props;
    const key = `filter:${tag.field}`;
    // const params = {exclude: entity.id, [key]: tag.value};
    const params = { [key]: tag.value };
    const query = queryString.stringify(params);
    return `/search?${query}`;
  }

  render() {
    const { intl, entity, tags } = this.props;

    if (!tags || !entity.links || !tags.results || tags.results.length === 0) {
      return (
        <ErrorSection
          icon="tag"
          title={intl.formatMessage(messages.no_tags)}
        />
      );
    }

    return (
      <React.Fragment>
        <table className="data-table">
          <thead>
            <tr>
              <th className="entity">
                <span className="value">
                  <FormattedMessage
                    id="tags.title"
                    defaultMessage="Extracted selectors"
                  />
                </span>
              </th>
              <th className="numeric">
                <span className="value">
                  <FormattedMessage
                    id="tags.results"
                    defaultMessage="Citations"
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tags.results.map(tag => (
              <tr key={tag.id}>
                <td className="entity">
                  <Link to={this.getLink(tag)}>
                    <Tag.Icon field={tag.field} />
                    {tag.value}
                  </Link>
                </td>
                <td className="numeric">
                  <FormattedNumber value={tag.count} />
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
  tags: selectEntityTags(state, ownProps.entity.id),
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(EntityTagsMode);
