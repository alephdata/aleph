// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';

import {
  Collection, EntityDecisionRow, Skeleton, JudgementButtons, Score,
} from 'components/common';

import EntityCompare from 'components/Entity/EntityCompare';

class XrefTableRow extends Component {
  renderSkeleton() {
    return (
      <tr>
        <td className="decision" />
        <td className="entity bordered">
          <EntityCompare isPending={true} />
        </td>
        <td className="entity">
          <EntityCompare isPending={true} />
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
    const { isPending, onDecide, selected, xref } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }

    if (!xref.entity || !xref.match) {
      return null;
    }
    return (
      <EntityDecisionRow className="XrefTableRow" selected={selected}>
        <td className="numeric narrow">
          <JudgementButtons obj={xref} onChange={onDecide} />
        </td>
        <td className="entity bordered">
          <EntityCompare entity={xref.entity} other={xref.match} showEmpty={true} />
        </td>
        <td className="entity">
          <EntityCompare entity={xref.match} other={xref.entity} showEmpty={true} />
        </td>
        <td className="numeric narrow">
          <Score score={xref.score} />
        </td>
        <td className="collection">
          <Collection.Link collection={xref.match?.collection} icon />
        </td>
      </EntityDecisionRow>
    );
  }
}

export default XrefTableRow;
