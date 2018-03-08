import React from 'react';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup, Button, AnchorButton } from "@blueprintjs/core";

import './PagingButtons.css';

export default class extends React.Component {
  render() {
    const { pageNumber, pageTotal, location: loc } = this.props;
    
    // Preserve exsting hash value while updating any existing value for 'page'
    const parsedHash = queryString.parse(loc.hash);
    if (parsedHash.page)
      delete parsedHash.page
    
    parsedHash.page = pageNumber-1;
    const prevButtonLink = queryString.stringify(parsedHash);
    
    parsedHash.page = pageNumber+1;
    const nextButtonLink = queryString.stringify(parsedHash);
    
    if (pageNumber && pageNumber > 0 &&
       pageTotal && pageTotal > 0) {
       return (
         <ButtonGroup className="PagingButtons" minimal={false} style={{float: 'left'}}>
             <AnchorButton href={`#${prevButtonLink}`} icon="arrow-left" disabled={pageNumber <= 1}/>
             <Button disabled className="PagingText">
               <FormattedMessage
                 id="document.paging"
                 defaultMessage="Page {pageNumber} of {pageTotal}"
                 values={{
                    pageNumber: pageNumber,
                    pageTotal: pageTotal
                  }}
               />
             </Button>
             <AnchorButton href={`#${nextButtonLink}`} icon="arrow-right" disabled={pageNumber >= pageTotal}/>
         </ButtonGroup>
       );
     } else {
       return null
     }
  }
}