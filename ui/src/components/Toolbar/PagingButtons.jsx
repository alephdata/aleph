import React from 'react';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup, Button, AnchorButton } from "@blueprintjs/core";

import './PagingButtons.css';

class PagingButtons extends React.Component {
  render() {
    const { document: doc, location: loc, numberOfPages } = this.props;

    // Preserve exsting hash value while updating any existing value for 'page'
    const parsedHash = queryString.parse(loc.hash);
    const currentPage = (parsedHash.page && parseInt(parsedHash.page, 10) <= numberOfPages) ? parseInt(parsedHash.page, 10) : 1;

    parsedHash.page = currentPage - 1;
    const prevButtonLink = queryString.stringify(parsedHash);

    parsedHash.page = currentPage + 1;
    const nextButtonLink = queryString.stringify(parsedHash);

    // Only displays paging buttons on PDF docs
    // Having the logic here makes it easier to use this component.
    if (doc && doc.links && doc.links.pdf &&
      currentPage && currentPage > 0 &&
      numberOfPages && numberOfPages > 0) {
      return (
          <ButtonGroup className="PagingButtons" minimal={false} style={{float: 'left'}}>
              <AnchorButton href={`#${prevButtonLink}`} icon="arrow-left" disabled={currentPage <= 1}/>
              <Button disabled className="PagingText">
                  <FormattedMessage
                      id="document.paging"
                      defaultMessage="Page {currentPage} of {numberOfPages}"
                      values={{
                          currentPage: currentPage,
                          numberOfPages: numberOfPages
                      }}
                  />
              </Button>
              <AnchorButton href={`#${nextButtonLink}`} icon="arrow-right" disabled={currentPage >= numberOfPages}/>
          </ButtonGroup>
      );
    } else {
      return null
    }
  }
}

PagingButtons = withRouter(PagingButtons);
export default PagingButtons