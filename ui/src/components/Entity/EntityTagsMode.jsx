import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  defineMessages,
  FormattedNumber,
  FormattedMessage,
  injectIntl,
} from 'react-intl';

import { Skeleton, Tag, ErrorSection } from 'components/common';
import { selectEntityTags, selectModel } from 'selectors';
import getValueLink from 'util/getValueLink';

import './EntityTagsMode.scss';

const messages = defineMessages({
  no_tags: {
    id: 'entity.tags.no_tags',
    defaultMessage: 'No selectors were extracted from this entity.',
  },
});

class EntityTagsMode extends React.Component {
  renderSkeletonRow(key) {
    return (
      <tr key={key}>
        <td className="entity">
          <Skeleton.Text type="span" length={15} />
        </td>
        <td className="numeric">
          <Skeleton.Text type="span" length={5} />
        </td>
      </tr>
    );
  }

  renderRow(tag) {
    const { model } = this.props;
    const type = Object.values(model.types).find((t) => t.group === tag.field);
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

    if (
      !tags.isPending &&
      (!entity?.links || !tags?.results || tags.results.length === 0)
    ) {
      return (
        <ErrorSection icon="tag" title={intl.formatMessage(messages.no_tags)} />
      );
    }

    const skeletonItems = [...Array(15).keys()];

    return (
      <>
        <table className="data-table">
          <thead>
            <tr>
              <th className="entity">
                <span className="value">
                  <FormattedMessage id="tags.title" defaultMessage="Term" />
                </span>
              </th>
              <th className="numeric">
                <span className="value">
                  <FormattedMessage
                    id="tags.results"
                    defaultMessage="Mention count"
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tags.results?.map((tag) => this.renderRow(tag))}
            {tags.isPending &&
              skeletonItems.map((i) => this.renderSkeletonRow(i))}
          </tbody>
        </table>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  tags: selectEntityTags(state, ownProps.entity.id),
  model: selectModel(state),
});

export default compose(connect(mapStateToProps), injectIntl)(EntityTagsMode);
