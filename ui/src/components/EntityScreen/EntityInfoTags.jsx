import React, { Component } from 'react';
import { connect } from 'react-redux';
import {Link} from 'react-router-dom';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import Tag from 'src/components/common/Tag';
import { fetchEntityTags } from '../../actions/index';
import getPath from 'src/util/getPath';

class EntityInfoTags extends Component {
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
      return null;
    }

    const linkPath = getPath(entity.links.ui) + '/related';
  
    return (
      <div className="tags">
        <h2>
          <FormattedMessage id="entity.section.tags" defaultMessage="Related tags"/>
        </h2>
        <table className="info-rank">
          <tbody>
            { tags.results.map((tag) => (
              <tr key={tag.id}>
                <th>
                  <Tag.Icon field={tag.field} />
                  <Link to={`${linkPath}${tag.id}`}>
                    {tag.value}
                  </Link>
                </th>
                <td className="numeric">
                  <FormattedNumber value={tag.count} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
