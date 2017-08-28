import React from 'react';

const Callout = ({modifier, title, desc}) => {
  const cssClasses = ['pt-callout'];
  if (modifier) cssClasses.push('pt-intent-' + modifier);

  return <div className={cssClasses.join(' ')}>
    <h5>{title}</h5>
    {desc && <div>{desc}</div>}
  </div>
};

export default Callout;
