import React, { Component } from 'react';
import { injectIntl, FormattedNumber } from 'react-intl';
import { Button } from '@blueprintjs/core';
import c from 'classnames';

import {
  Collection, Entity, Property, Skeleton,
} from 'src/components/common';
import XrefDecisionButtons from 'src/components/XrefTable/XrefDecisionButtons';


class XrefTableRow extends Component {
  renderSkeleton() {
    return (
      <tr>
        <td className="expand" />
        <td className="entity bordered">
          <Skeleton.Text type="span" length={15} />
        </td>
        <td className="entity">
          <Skeleton.Text type="span" length={15} />
        </td>
        <td className="numeric narrow">
          <Skeleton.Text type="span" length={2} />
        </td>
        <td className="collection">
          <Skeleton.Text type="span" length={15} />
        </td>
      </tr>
    );
  }

  getCommonProperties() {
    const { xref } = this.props;
    const properties = [...xref.entity.schema.getFeaturedProperties()];

    xref.match.schema.getFeaturedProperties().forEach((prop) => {
      if (properties.indexOf(prop) === -1) {
        properties.push(prop);
      }
    });

    return properties;
  }

  renderProperties(entity) {
    const properties = this.getCommonProperties();

    return (
      <div className="XrefTableRow__properties">
        {properties.map((prop) => (
          <div className="XrefTableRow__property" key={prop.name}>
            <span className="XrefTableRow__property__name text-muted">
              <Property.Name prop={prop} />
            </span>
            <span className="XrefTableRow__property__value">
              <Property.Values prop={prop} values={entity.getProperty(prop)} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { isExpanded, isPending, contextId, xref } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }

    if (!xref.entity || !xref.match) {
      return null;
    }
    const showDetail = isExpanded || contextId;
    const expandIcon = isExpanded ? 'chevron-up' : 'chevron-down';
    return (
      <tr className="XrefTableRow">
        <td className={c({'expand': !contextId, 'numeric narrow': contextId})}>
          {!contextId && (
            <Button onClick={() => this.props.toggleExpand(xref)} small minimal icon={expandIcon} />
          )}
          {contextId && (
            <XrefDecisionButtons xref={xref} contextId={contextId} />
          )}
        </td>
        <td className="entity bordered">
          <Entity.Link entity={xref.entity} preview icon />
          {showDetail && this.renderProperties(xref.entity)}
        </td>
        <td className="entity">
          <Entity.Link entity={xref.match} preview icon />
          {showDetail && this.renderProperties(xref.match)}
        </td>
        <td className="numeric narrow">
          <FormattedNumber value={parseInt(parseFloat(xref.score) * 100, 10)} />
        </td>
        <td className="collection">
          <Collection.Link preview collection={xref.match_collection} icon />

        </td>
      </tr>
    );
  }
}

export default injectIntl(XrefTableRow);
