import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ButtonGroup, Button, AnchorButton } from "@blueprintjs/core";

import './PagingButtons.css';

export default class extends React.Component {
  render() {
    const { location: loc } = this.props;
    if (this.props.pageNumber && this.props.pageNumber > 0 &&
       this.props.pageTotal && this.props.pageTotal > 0) {
       return (
         <ButtonGroup className="PagingButtons" minimal={false} style={{float: 'left'}}>
             <AnchorButton href={`${(loc.hash) ? loc.hash+'&' : '#'}page=${this.props.pageNumber-1}`} icon="arrow-left" disabled={this.props.pageNumber <= 1}/>
             <Button disabled className="PagingText">
               <FormattedMessage
                 id="document.paging"
                 defaultMessage="Page {pageNumber} of {pageTotal}"
                 values={{
                    pageNumber: this.props.pageNumber,
                    pageTotal: this.props.pageTotal
                  }}
               />
             </Button>
             <AnchorButton href={`${(loc.hash) ? loc.hash+'&' : '#'}page=${this.props.pageNumber+1}`} icon="arrow-right" disabled={this.props.pageNumber >= this.props.pageTotal}/>
         </ButtonGroup>
       );
     } else {
       return null
     }
  }
}