import classNames from "classnames";
import * as React from "react";

import {DISPLAYNAME_PREFIX, InputGroup, Keys, Popover, Position, Utils,} from "@blueprintjs/core";
import {Classes} from "@blueprintjs/select/lib/esm/common";
import {QueryList} from "@blueprintjs/select/lib/esm/components/query-list/queryList";


export class Suggest extends React.PureComponent {
  static displayName = `${DISPLAYNAME_PREFIX}.Suggest`;


  static defaultProps = {
    closeOnSelect: true,
    openOnKeyDown: false,
  };

  static ofType() {
    return Suggest => Suggest;
  }

  TypedQueryList = QueryList.ofType();
  refHandlers = {
    input: (ref) => {
      this.input = ref;
      const {inputProps = {}} = this.props;
      Utils.safeInvoke(inputProps.inputRef, ref);
    },
    queryList: (ref) => (this.queryList = ref),
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      isOpen: (props.popoverProps && props.popoverProps.isOpen) || false,
      selectedItem: this.getInitialSelectedItem(),
    };
  }

  render() {
    // omit props specific to this component, spread the rest.
    const {inputProps, popoverProps, ...restProps} = this.props;

    return (
      // @ts-ignore
      <this.TypedQueryList
        {...restProps}
        onItemSelect={this.handleItemSelect}
        ref={this.refHandlers.queryList}
        renderer={this.renderQueryList}
      />
    );
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedItem !== undefined && nextProps.selectedItem !== this.state.selectedItem) {
      this.setState({selectedItem: nextProps.selectedItem});
    }
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.isOpen && !prevState.isOpen && this.queryList != null) {
      this.queryList.scrollActiveItemIntoView();
    }
  }

  renderQueryList = (listProps) => {
    const {inputProps = {}, popoverProps = {}} = this.props;
    const {isOpen, selectedItem} = this.state;
    const {handleKeyDown, handleKeyUp} = listProps;
    const {placeholder = "Search..."} = inputProps;

    const selectedItemText = selectedItem ? this.props.inputValueRenderer(selectedItem) : "";
    return (
      <Popover
        autoFocus={false}
        enforceFocus={false}
        isOpen={isOpen}
        position={Position.BOTTOM_LEFT}
        {...popoverProps}
        className={classNames(listProps.className, popoverProps.className)}
        onInteraction={this.handlePopoverInteraction}
        popoverClassName={classNames(Classes.SELECT_POPOVER, popoverProps.popoverClassName)}
        onOpened={this.handlePopoverOpened}
      >
        <InputGroup
          {...inputProps}
          placeholder={isOpen && selectedItemText ? selectedItemText : placeholder}
          inputRef={this.refHandlers.input}
          onChange={listProps.handleQueryChange}
          onFocus={this.handleInputFocus}
          onKeyDown={this.getTargetKeyDownHandler(handleKeyDown)}
          onKeyUp={this.getTargetKeyUpHandler(handleKeyUp)}
          value={listProps.query}
        />
        <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
          {listProps.itemList}
        </div>
      </Popover>
    );
  };

  selectText = () => {
    // wait until the input is properly focused to select the text inside of it
    requestAnimationFrame(() => {
      if (this.input != null) {
        this.input.setSelectionRange(0, this.input.value.length);
      }
    });
  };

  handleInputFocus = (event) => {
    const {openOnKeyDown, inputProps = {}} = this.props;

    this.selectText();

    // TODO can we leverage Popover.openOnTargetFocus for this?
    if (!openOnKeyDown) {
      this.setState({isOpen: true});
    }

    Utils.safeInvoke(inputProps.onFocus, event);
  };

  handleItemSelect = (item, event) => {
    let nextOpenState;
    if (!this.props.closeOnSelect) {
      if (this.input != null) {
        this.input.focus();
      }
      this.selectText();
      nextOpenState = true;
    } else {
      if (this.input != null) {
        this.input.blur();
      }
      nextOpenState = false;
    }
    // the internal state should only change when uncontrolled.
    if (this.props.selectedItem === undefined) {
      this.setState({
        isOpen: nextOpenState,
        selectedItem: item,
      });
    } else {
      // otherwise just set the next open state.
      this.setState({isOpen: nextOpenState});
    }

    Utils.safeInvoke(this.props.onItemSelect, item, event);
  };

  getInitialSelectedItem() {
    // controlled > uncontrolled > default
    if (this.props.selectedItem !== undefined) {
      return this.props.selectedItem;
    } else if (this.props.defaultSelectedItem !== undefined) {
      return this.props.defaultSelectedItem;
    } else {
      return null;
    }
  }

  handlePopoverInteraction = (nextOpenState) =>
    requestAnimationFrame(() => {
      const {popoverProps = {}} = this.props;

      if (this.input != null && this.input !== document.activeElement) {
        // the input is no longer focused so we can close the popover
        this.setState({isOpen: false});
      }

      Utils.safeInvoke(popoverProps.onInteraction, nextOpenState);
    });

  handlePopoverOpened = (node) => {
    const {popoverProps = {}} = this.props;

    // scroll active item into view after popover transition completes and all dimensions are stable.
    if (this.queryList != null) {
      this.queryList.scrollActiveItemIntoView();
    }

    Utils.safeInvoke(popoverProps.onOpened, node);
  };

  getTargetKeyDownHandler = (
    handleQueryListKeyDown,
  ) => {
    return (evt) => {
      const {which} = evt;
      const {inputProps = {}, openOnKeyDown} = this.props;

      if (which === Keys.ESCAPE || which === Keys.TAB) {
        if (this.input != null) {
          this.input.blur();
        }
        this.setState({
          isOpen: false,
        });
      } else if (
        openOnKeyDown &&
        which !== Keys.BACKSPACE &&
        which !== Keys.ARROW_LEFT &&
        which !== Keys.ARROW_RIGHT
      ) {
        this.setState({isOpen: true});
      }

      if (this.state.isOpen) {
        Utils.safeInvoke(handleQueryListKeyDown, evt);
      }

      Utils.safeInvoke(inputProps.onKeyDown, evt);
    };
  };

  getTargetKeyUpHandler = (handleQueryListKeyUp) => {
    return (evt) => {
      const {inputProps = {}} = this.props;
      if (this.state.isOpen) {
        Utils.safeInvoke(handleQueryListKeyUp, evt);
      }
      Utils.safeInvoke(inputProps.onKeyUp, evt);
    };
  };
}