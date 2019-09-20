import React from 'react';
import { Drawer, Position } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';


import './SearchTips.scss';

const tips = [
  {
    id: 'exact',
    title: 'Exact matches',
    content: [
      'Use <em>""</em> to return only exact matches.  For example, the search <em>"barack obama”</em> will return only results containing the exact phrase "barack obama"',
    ],
  },
  {
    id: 'spelling',
    title: 'Spelling variants',
    content: [
      'Use <em>~</em> to increase the fuzziness of a search.  For example, <em>Wladimir~2</em> will return not just the term “Wladimir” but also similar spellings such as "Wladimyr" or "Vladimyr". A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.',
    ],
  },
  {
    id: 'composite',
    title: 'Composite queries',
    content: [
      'The search <em>banana ice cream</em> prioritizes results that contain all three terms: banana, ice, and cream.  Results with one or more of the given terms will follow',
      '<em>+banana ice cream</em> requires that only results with the term banana will be returned, while ice and cream are optional',
      '<em>-banana ice cream</em> ensures that no results with the term banana will be returned',
      '<em>banana AND “ice cream”</em> requires that only results with both banana and ice cream are returned',
      '<em>banana OR “ice cream”</em> ensures that only results with either banana or ice cream are returned',
      'These operations can be combined as you like.  For example <em>banana AND (“ice cream” OR “gelato”) -chocolate</em> will return results where banana appears with ice cream or gelato in the document but where chocolate is not present',
    ],
  },
  {
    id: 'proximity',
    title: 'Proximity searches',
    content: [
      'To search for two terms within a certain distance of each other, use double quotes <em>""</em> around the two words and the tilde <em>~</em> symbol at the end of the phrase.  For example <em>“Bank America”~2</em> will find relevant matches with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".',
    ],
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
              <div key={tip.id} className="SearchTips__section">
                <h5 className="SearchTips__section__title">
                  <FormattedMessage
                    id={`searchTips.${tip.id}.title`}
                    defaultMessage={tip.title}
                  />
                </h5>
                <ul className="SearchTips__section__content">
                  {/* eslint-disable react/no-array-index-key */}
                  {tip.content.map((contentItem, i) => (
                    <li className="SearchTips__section__item" key={i}>
                      <FormattedMessage
                        id={`searchTips.${tip.id}.${i}`}
                        defaultMessage={contentItem}
                      >
                        {msg => <span dangerouslySetInnerHTML={{ __html: msg }} />}
                      </FormattedMessage>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Drawer>
      </div>
    );
  }
}
