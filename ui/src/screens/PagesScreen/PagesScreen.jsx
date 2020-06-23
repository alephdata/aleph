import React from 'react';
import ReactMarkdown from 'react-markdown';
import { defineMessages, injectIntl } from 'react-intl';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { selectPages, selectPage, selectMetadata } from 'src/selectors';

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
    const menuPages = pages.filter((page) => !page.home)
      .sort((a, b) => a.short.localeCompare(b.short));

    return (
      <Screen title={page.title}>
        <div className="Pages">
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
            </Menu>
          </div>
          <div className="Pages__body">
            <div className="Pages__title-container">
              <h5 className="Pages__title">{page.title}</h5>
            </div>
            <div className="Pages__content">
              <ReactMarkdown>
                {page.content}
              </ReactMarkdown>
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
