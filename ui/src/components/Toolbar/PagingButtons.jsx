import React from 'react';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup, Button, AnchorButton } from '@blueprintjs/core';

import './PagingButtons.scss';


class PagingButtons extends React.PureComponent {
  render() {
    const { document, location, numberOfPages } = this.props;

    if (document.isLoading || !document.links) {
      return null;
    }

    // Preserve exsting hash value while updating any existing value for 'page'
    const parsedHash = queryString.parse(location.hash);
    const currentPage = (
      parsedHash.page && parseInt(parsedHash.page, 10) <= numberOfPages
    ) ? parseInt(parsedHash.page, 10) : 1;

    parsedHash.page = currentPage - 1;
    const prevButtonLink = queryString.stringify(parsedHash);

    parsedHash.page = currentPage + 1;
    const nextButtonLink = queryString.stringify(parsedHash);

    // Only displays paging buttons on PDF docs
    // Having the logic here makes it easier to use this component.
    if (currentPage && currentPage > 0
        && numberOfPages && numberOfPages > 0) {
      return (
        <ButtonGroup className="PagingButtons" fill>
          <AnchorButton href={`#${prevButtonLink}`} icon="arrow-left" disabled={currentPage <= 1} />
          <Button disabled className="paging-text">
            <FormattedMessage
              id="document.paging"
              defaultMessage="Page {currentPage} of {numberOfPages}"
              values={{
                currentPage,
                numberOfPages,
              }}
            />
          </Button>
          <AnchorButton href={`#${nextButtonLink}`} icon="arrow-right" disabled={currentPage >= numberOfPages} />
        </ButtonGroup>
      );
    }
    return null;
  }
}


export default withRouter(PagingButtons);
