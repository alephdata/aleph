{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React from 'react';
import { Skeleton } from 'components/common';


import './QuickLinks.scss'

class QuickLinks extends React.Component {
  renderSkeleton() {
    return (
      [...Array(4).keys()].map(key => (
        <div className="QuickLinks__item" key={key}>
          <Skeleton.Text type="div" length="250" className="QuickLinks__item__content" />
        </div>
      ))
    );
  }

  render() {
    const { children, isPending } = this.props;

    return (
      <div className="QuickLinks">
        {isPending && this.renderSkeleton()}
        {!isPending && children}
      </div>
    )
  }
}

export default QuickLinks;
