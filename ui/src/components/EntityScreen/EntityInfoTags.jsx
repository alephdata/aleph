import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import Tag from 'src/components/common/Tag';
import { fetchEntityTags } from '../../actions/index';
import getPath from 'src/util/getPath';

class EntityInfoTags extends React.Component {
  componentDidMount() {
    const { entity } = this.props;
    if (!this.props.tags && entity && entity.id) {
      this.props.fetchEntityTags(entity);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity.id !== nextProps.entity.id) {
      this.props.fetchEntityTags(nextProps.entity);
    }
  }

  render() {
    const { tags, entity } = this.props;

    if (!tags || !entity.links || !tags.results || tags.results.length === 0) {
      return (
        <React.Fragment>
          <p className="pt-text-muted">
            <FormattedMessage 
              id="entity.info.tags.empty_description"
              defaultMessage="There are no known links."/>
          </p>
        </React.Fragment>
      );
    }

    const linkPath = getPath(entity.links.ui) + '/related';
  
    return (
      <div className="tags">
        <ul className="info-rank">
          { tags.results.map((tag) => (
            <li key={tag.id}>
              <span className="key">
                <Tag.Icon field={tag.field} />
                <Link to={`${linkPath}${tag.id}`}>
                  {tag.value}
                </Link>
              </span>
              <span className="value">
                <FormattedNumber value={tag.count} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    tags: state.entityTags[ownProps.entity.id]
  };
};

export default connect(mapStateToProps, {fetchEntityTags})(EntityInfoTags);
