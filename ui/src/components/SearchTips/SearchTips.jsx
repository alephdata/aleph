import React from 'react';
import { Drawer, Position, Card } from '@blueprintjs/core';

import './SearchTips.scss';

const tips = [
  {
    title: 'Exact matches',
    content: '<p>To find exact matches for a given search term, e.g. to search for a person or company, try putting the name in quotes:</p><p class="example">"Barack Obama"</p>',
  },
  {
    title: 'Proximity Searches',
    content: '<p>If you do not want to find a precise string, but merely specify that two words are supposed to appear close to each other, you might want to use proximity search. This will try to find all the requested search terms within a given distance from each other:</p><p class="example">"Bank America"~2</p><p>This will find relevant matches with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".</p>',
  },
  {
    title: 'Spelling errors',
    content: '<p>The same principle of proximity can also be applied inside of individual words. A search will then try to find not just the precise word you have specified, but also spelling variants. A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.</p><p class="example">Wladimir~2</p><p>This will find not just the term "Wladimir", but also similar words such as "Vladimir", "Wladimyr" or "Vladimyr". Note that if you set the permissible distance too high, you will get very slow searches and many false results.</p>',
  },
  {
    title: 'Composite queries',
    content: '<p>You can make queries composed of multiple terms in various ways. The simplest form is to just put more than one word into the search bar. In this case, Aleph will try and find documents that contain all of the given terms and put these first. After that, results that miss any of the given search terms will also be shown.</p><p>If you want to make sure that a given term must show up in the results (or may never show up), you can put a plus sign ("+") in front of it (or a minus sign, "-", to make sure all documents with the given word are removed).</p><p class="example">banana -ice -cream +fruit</p>',
  },
  {
    title: 'Boolean queries',
    content: '<p>You can also make more complex, boolean queries in which the terms "OR" and "AND" are used to specify the that certain search terms must appear together (or can serve as alternatives to each other).</p><p class="example">banana AND ("ice cream" OR gelato)</p>',
  },
];

export default class SearchTips extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    return (
      <div className="SearchTips" ref={this.ref}>
        <Drawer
          isOpen={this.props.isOpen}
          position={Position.TOP}
          canOutsideClickClose
          usePortal
          hasBackdrop={false}
          portalContainer={this.ref.current}
        >
          <div className="SearchTips__content">
            {tips.map(tip => (
              <Card key={tip.title} className="SearchTips__section">
                <h5 className="SearchTips__section__title">{tip.title}</h5>
                <div className="SearchTips__section__content" dangerouslySetInnerHTML={{ __html: tip.content }} />
              </Card>
            ))}
          </div>
        </Drawer>
      </div>
    );
  }
}
