{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React from "react";
import { useHotkeys } from "@blueprintjs/core";

const HotkeysContainer = ({ children, hotkeys }) => {
  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <div tabIndex={0} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
      {children}
    </div>
  );
}

export default HotkeysContainer;
