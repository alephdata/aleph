import React from 'react';
import {FormattedMessage} from "react-intl";

const Callout = ({modifier, title, desc}) => {
  const cssClasses = ['pt-callout'];
  if (modifier) cssClasses.push('pt-intent-' + modifier);

  return <div className={cssClasses.join(' ')}>
    <h5>{<FormattedMessage id={title}/>}</h5>
    {desc && <FormattedMessage id={desc}/>}
  </div>
};

export default Callout;
