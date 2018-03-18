import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import Tag from 'src/components/common/Tag';
import { fetchEntityTags } from 'src/actions/index';
import { getEntityTags } from 'src/selectors';


class EntityInfoTags extends React.Component {
  componentDidMount() {
    this.fetchIfNeeded(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity.id !== nextProps.entity.id) {
      this.fetchIfNeeded(nextProps);
    }
  }

  fetchIfNeeded(props) {
    const { entity, tags } = props;
    if ((!tags || tags.total === undefined)&& entity && entity.id) {
      this.props.fetchEntityTags(entity);
    }
  }

  getLink(tag) {
    const { entity } = this.props;
    const key = `filter:${tag.field}`;
    const params = {exclude: entity.id, [key]: tag.value};
    const query = queryString.stringify(params);
    return `/search?${query}`;
  }

  render() {
    const { tags, entity } = this.props;

    if (!tags || !entity.links || !tags.results || tags.results.length === 0) {
      return (
        <React.Fragment>
          <p className="pt-text-muted">
            <FormattedMessage 
              id="entity.info.tags.empty_description"
              defaultMessage="No links found."/>
          </p>
        </React.Fragment>
      );
    }
    
    
    
  
    return (
      <div className="tags">
        <ul className="info-rank">
          { tags.results.map((tag) => (
            <li key={tag.id}>
              <span className="key">
                <Tag.Icon field={tag.field} />
                <Link to={this.getLink(tag)}>
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
    tags: getEntityTags(state, ownProps.entity.id)
  };
};

export default connect(mapStateToProps, {fetchEntityTags})(EntityInfoTags);
