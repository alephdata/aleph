import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  defineMessages, FormattedNumber, FormattedMessage, injectIntl,
} from 'react-intl';

import { Tag, ErrorSection } from 'src/components/common';
import { selectEntityTags, selectModel } from 'src/selectors';
import getValueLink from 'src/util/getValueLink';

import './EntityTagsMode.scss';

const messages = defineMessages({
  no_tags: {
    id: 'entity.tags.no_tags',
    defaultMessage: 'No selectors were extracted from this entity.',
  },
});


class EntityTagsMode extends React.Component {
  renderRow(tag) {
    const { model } = this.props;
    const type = Object.values(model.types).find(t => t.group === tag.field);
    if (!type) {
      return null;
    }
    return (
      <tr key={tag.id}>
        <td className="entity">
          <Link to={getValueLink(type, tag.value)}>
            <Tag.Icon field={tag.field} />
            {tag.value}
          </Link>
        </td>
        <td className="numeric">
          <FormattedNumber value={tag.count} />
        </td>
      </tr>
    );
  }

  render() {
    const { intl, entity, tags } = this.props;
    if (!entity || !entity.links || !tags || !tags.results || tags.results.length === 0) {
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
            {tags.results.map(tag => this.renderRow(tag))}
          </tbody>
        </table>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  tags: selectEntityTags(state, ownProps.entity.id),
  model: selectModel(state),
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(EntityTagsMode);
