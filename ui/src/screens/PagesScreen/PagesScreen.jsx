import React from 'react';
import ReactMarkdown from 'react-markdown';
import { defineMessages, injectIntl } from 'react-intl';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { isLangRtl } from '@alephdata/react-ftm';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Screen from 'components/Screen/Screen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { AppItem } from 'components/common';
import { selectPages, selectPage } from 'selectors';

import './PagesScreen.scss';
import getPageLink from '../../util/getPageLink';


const messages = defineMessages({
  not_found: {
    id: 'pages.not.found',
    defaultMessage: 'Page not found',
  },
  greeting: {
    id: 'notifications.greeting',
    defaultMessage: 'What\'s new, {role}?',
  },
});


export class PagesScreen extends React.Component {
  constructor(props) {
    super(props);
    this.navigate = this.navigate.bind(this);
  }

  navigate(path) {
    this.props.history.push(path);
  }

  render() {
    const { intl, page, pages } = this.props;
    if (!page) {
      return <ErrorScreen error={intl.formatMessage(messages.not_found)} />;
    }
    const menuPages = pages.filter((page) => page.sidebar)
      .sort((a, b) => a.short.localeCompare(b.short));

    const contentDir = isLangRtl(page.lang) ? "rtl" : "ltr";

    return (
      <Screen title={page.title} exemptFromRequiredAuth>
        <div className="Pages">
          <div className="Pages__body">
            <h5 className="Pages__title" dir={contentDir}>{page.title}</h5>
            <div className="Pages__content-container">
              <div className="Pages__content" dir={contentDir}>
                <ReactMarkdown>
                  {page.content}
                </ReactMarkdown>
              </div>
              <div className="Pages__menu">
                <Menu>
                  {menuPages.map(menuPage => (
                    <MenuItem
                      key={menuPage.name}
                      icon={menuPage.icon}
                      text={menuPage.short}
                      onClick={() => this.navigate(getPageLink(menuPage))}
                      active={menuPage.name === page.name}
                    />
                  ))}
                  <MenuDivider />
                  <AppItem />
                </Menu>
              </div>
            </div>
          </div>
        </div>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { page } = ownProps.match.params;
  return {
    pages: selectPages(state),
    page: selectPage(state, page),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(PagesScreen);
