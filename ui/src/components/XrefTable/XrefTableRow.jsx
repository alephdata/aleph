import React, { Component } from 'react';
import { injectIntl, FormattedNumber } from 'react-intl';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import Property from 'src/components/Property';
import { Button, Callout } from '@blueprintjs/core';
import c from 'classnames';
import {
  Collection, Entity, Skeleton,
} from 'src/components/common';
/* eslint-disable */

class XrefTableRow extends Component {
  renderSkeleton() {
    return (
      <tr>
        <td className="expand">
          <Skeleton.Text type="span" length={1} />
        </td>
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

  render() {
    const { isExpanded, isLoading, xref } = this.props;

    if (isLoading) {
      return this.renderSkeleton();
    }

    if (!xref.entity || !xref.match) {
      return null;
    }
    const expandIcon = isExpanded ? 'chevron-up' : 'chevron-down';
    const mainRow = (
      <tr className={c({ prefix: isExpanded })}>
        <td className="expand">
          <Button onClick={() => this.props.toggleExpand(xref)} small minimal icon={expandIcon} />
        </td>
        <td className="entity bordered">
          <Entity.Link entity={xref.entity} preview icon />
        </td>
        <td className="entity">
          <Entity.Link entity={xref.match} preview icon />
        </td>
        <td className="numeric narrow">
          <FormattedNumber value={parseInt(parseFloat(xref.score) * 100, 10)} />
        </td>
        <td className="collection">
          <Collection.Link preview collection={xref.match_collection} icon />
        </td>
      </tr>
    );
    if (!isExpanded) {
      return mainRow;
    }
    const properties = [...xref.entity.schema.getFeaturedProperties()];
    xref.match.schema.getFeaturedProperties().forEach((prop) => {
      if (properties.indexOf(prop) === -1) {
        properties.push(prop);
      }
    });
    return [
      mainRow,
      <tr>
        <td />
        <td className="bordered">
          <Callout>
            {properties.map((prop) => (
              <div>
                <div>
                  <Property.Name prop={prop} />
                </div>
                <div>
                  <strong>
                    <Property.Values prop={prop} values={xref.entity.getProperty(prop)} />
                  </strong>
                </div>
              </div>
            ))}
          </Callout>
        </td>
        <td>
          <Callout>
            {properties.map((prop) => (
              <div>
                <div>
                  <Property.Name prop={prop} />
                </div>
                <div>
                  <strong>
                    <Property.Values prop={prop} values={xref.match.getProperty(prop)} />
                  </strong>
                </div>
              </div>
            ))}
          </Callout>
        </td>
        <td colSpan={2} />
      </tr>
    ];
  }
}

export default injectIntl(XrefTableRow);
