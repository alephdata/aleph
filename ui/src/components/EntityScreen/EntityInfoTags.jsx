import React, { Component } from 'react';
import { connect } from 'react-redux';
import {Link} from 'react-router-dom';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import Tag from 'src/components/common/Tag';
import { fetchEntityTags } from '../../actions/index';

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
    const { tags } = this.props;

    if (!tags || !tags.results || tags.results.length === 0) {
      return null;
    }
  
    return (
      <div className="tags">
        <h3>
          <FormattedMessage id="entity.section.tags" defaultMessage="Related tags"/>
        </h3>
        <table className="info-rank">
          <tbody>
            { tags.results.map((tag) => (
              <tr key={tag.id}>
                <th>
                  <Tag.Icon field={tag.field} />
                  <Link to={`/search${tag.id}`}>
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
