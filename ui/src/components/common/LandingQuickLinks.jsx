// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { compose } from 'redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, injectIntl } from 'react-intl';

import withRouter from 'app/withRouter'
import { QuickLinks } from 'components/common';


class LandingQuickLinks extends React.Component {
  render() {
    return (
      <QuickLinks>
        <Link to="/search" className="QuickLinks__item">
          <div className="QuickLinks__item__content">
            <div className="QuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_search.svg)' }} />
            <div className="QuickLinks__item__text">
              <p><FormattedMessage id="landing.shortcut.search" defaultMessage="Search entities" /></p>
            </div>
          </div>
        </Link>
        <Link to="/datasets" className="QuickLinks__item">
          <div className="QuickLinks__item__content">
            <div className="QuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_datasets.svg)' }} />
            <div className="QuickLinks__item__text">
              <p><FormattedMessage id="landing.shortcut.datasets" defaultMessage="Browse datasets" /></p>
            </div>
          </div>
        </Link>
        <Link to="/investigations" className="QuickLinks__item">
          <div className="QuickLinks__item__content">
            <div className="QuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_documents.svg)' }} />
            <div className="QuickLinks__item__text">
              <p><FormattedMessage id="landing.shortcut.investigation" defaultMessage="Start an investigation" /></p>
            </div>
          </div>
        </Link>
        <Link to="/alerts" className="QuickLinks__item">
          <div className="QuickLinks__item__content">
            <div className="QuickLinks__item__image" style={{ backgroundImage: 'url(/static/home_alerts.svg)' }} />
            <div className="QuickLinks__item__text">
              <p><FormattedMessage id="landing.shortcut.alert" defaultMessage="Create a search alert" /></p>
            </div>
          </div>
        </Link>
      </QuickLinks>
    )
  }
}

export default compose(
  withRouter,
  injectIntl,
)(LandingQuickLinks);
