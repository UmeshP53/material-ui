import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  unstable_useForkRef as useForkRef,
  unstable_useControlled as useControlled,
} from '@mui/utils';
import {
  SelectUnstyledListboxSlotProps,
  SelectUnstyledOwnerState,
  SelectUnstyledPopperSlotProps,
  SelectUnstyledProps,
  SelectUnstyledRootSlotProps,
} from './SelectUnstyled.types';
import { flattenOptionGroups, getOptionsFromChildren } from './utils';
import useSelect from './useSelect';
import { SelectChild, SelectOption } from './useSelect.types';
import { appendOwnerState } from '../utils';
import PopperUnstyled from '../PopperUnstyled';
import { SelectUnstyledContext, SelectUnstyledContextType } from './SelectUnstyledContext';
import composeClasses from '../composeClasses';
import { getSelectUnstyledUtilityClass } from './selectUnstyledClasses';
import { WithOptionalOwnerState } from '../utils/types';

function defaultRenderSingleValue<TValue>(selectedOption: SelectOption<TValue> | null) {
  return selectedOption?.label ?? '';
}

function useUtilityClasses(ownerState: SelectUnstyledOwnerState<any>) {
  const { active, disabled, open, focusVisible } = ownerState;

  const slots = {
    root: [
      'root',
      disabled && 'disabled',
      focusVisible && 'focusVisible',
      active && 'active',
      open && 'expanded',
    ],
    listbox: ['listbox', disabled && 'disabled'],
    popper: ['popper'],
  };

  return composeClasses(slots, getSelectUnstyledUtilityClass, {});
}

/**
 * The foundation for building custom-styled select components.
 */
const SelectUnstyled = React.forwardRef(function SelectUnstyled<TValue>(
  props: SelectUnstyledProps<TValue>,
  ref: React.ForwardedRef<any>,
) {
  const {
    autoFocus,
    children,
    className,
    component,
    components = {},
    componentsProps = {},
    defaultValue,
    defaultListboxOpen = false,
    disabled: disabledProp,
    listboxOpen: listboxOpenProp,
    onChange,
    onListboxOpenChange,
    renderValue: renderValueProp,
    value: valueProp,
    ...other
  } = props;

  const renderValue = renderValueProp ?? defaultRenderSingleValue;

  const [groupedOptions, setGroupedOptions] = React.useState<SelectChild<TValue>[]>([]);
  const options = React.useMemo(() => flattenOptionGroups(groupedOptions), [groupedOptions]);
  const [listboxOpen, setListboxOpen] = useControlled({
    controlled: listboxOpenProp,
    default: defaultListboxOpen,
    name: 'SelectUnstyled',
    state: 'listboxOpen',
  });

  React.useEffect(() => {
    setGroupedOptions(getOptionsFromChildren(children));
  }, [children]);

  const [buttonDefined, setButtonDefined] = React.useState(false);
  const buttonRef = React.useRef<HTMLElement | null>(null);
  const listboxRef = React.useRef<HTMLElement>(null);

  const Button = component ?? components.Root ?? 'button';
  const ListboxRoot = components.Listbox ?? 'ul';
  const Popper = components.Popper ?? PopperUnstyled;

  const handleButtonRefChange = (element: HTMLElement | null) => {
    buttonRef.current = element;

    if (element != null) {
      setButtonDefined(true);
    }
  };

  const handleButtonRef = useForkRef(ref, handleButtonRefChange);
  const handleListboxRef = useForkRef(listboxRef, componentsProps.listbox?.ref);

  React.useEffect(() => {
    if (autoFocus) {
      buttonRef.current!.focus();
    }
  }, [autoFocus]);

  const handleOpenChange = (isOpen: boolean) => {
    setListboxOpen(isOpen);
    onListboxOpenChange?.(isOpen);
  };

  const {
    buttonActive,
    buttonFocusVisible,
    disabled,
    getButtonProps,
    getListboxProps,
    getOptionProps,
    getOptionState,
    value,
  } = useSelect({
    buttonComponent: Button,
    buttonRef: handleButtonRef,
    defaultValue,
    disabled: disabledProp,
    listboxId: componentsProps.listbox?.id,
    listboxRef: handleListboxRef,
    multiple: false,
    onChange,
    onOpenChange: handleOpenChange,
    open: listboxOpen,
    options,
    value: valueProp,
  });

  const ownerState: SelectUnstyledOwnerState<TValue> = {
    ...props,
    active: buttonActive,
    defaultListboxOpen,
    disabled,
    focusVisible: buttonFocusVisible,
    open: listboxOpen,
    renderValue,
    value,
  };

  const classes = useUtilityClasses(ownerState);

  const selectedOptions = React.useMemo(() => {
    return options.find((o) => value === o.value);
  }, [options, value]);

  const buttonProps: WithOptionalOwnerState<SelectUnstyledRootSlotProps<TValue>> = appendOwnerState(
    Button,
    {
      ...getButtonProps(),
      ...other,
      ...componentsProps.root,
      className: clsx(className, componentsProps.root?.className, classes.root),
    },
    ownerState,
  );

  const listboxProps: WithOptionalOwnerState<SelectUnstyledListboxSlotProps<TValue>> =
    appendOwnerState(
      ListboxRoot,
      {
        ...getListboxProps(),
        ...componentsProps.listbox,
        className: clsx(componentsProps.listbox?.className, classes.listbox),
      },
      ownerState,
    );

  // Popper must be a (non-host) component, therefore ownerState will be present within the props
  const popperProps: SelectUnstyledPopperSlotProps<TValue> = appendOwnerState(
    Popper,
    {
      open: listboxOpen,
      anchorEl: buttonRef.current,
      placement: 'bottom-start' as const,
      disablePortal: true,
      role: undefined,
      ...componentsProps.popper,
      className: clsx(componentsProps.popper?.className, classes.popper),
    },
    ownerState,
  ) as SelectUnstyledPopperSlotProps<TValue>;

  const context: SelectUnstyledContextType = {
    getOptionProps,
    getOptionState,
    listboxRef,
  };

  return (
    <React.Fragment>
      <Button {...buttonProps}>{renderValue(selectedOptions as any)}</Button>
      {buttonDefined && (
        <Popper {...popperProps}>
          <ListboxRoot {...listboxProps}>
            <SelectUnstyledContext.Provider value={context}>
              {children}
            </SelectUnstyledContext.Provider>
          </ListboxRoot>
        </Popper>
      )}
    </React.Fragment>
  );
});

SelectUnstyled.propTypes /* remove-proptypes */ = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // |     To update them edit TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * If `true`, the select element is focused during the first mount
   * @default false
   */
  autoFocus: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * @ignore
   */
  component: PropTypes.elementType,
  /**
   * The components used for each slot inside the Select.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  components: PropTypes /* @typescript-to-proptypes-ignore */.shape({
    Listbox: PropTypes.elementType,
    Popper: PropTypes.elementType,
    Root: PropTypes.elementType,
  }),
  /**
   * The props used for each slot inside the Input.
   * @default {}
   */
  componentsProps: PropTypes.shape({
    listbox: PropTypes.object,
    popper: PropTypes.object,
    root: PropTypes.object,
  }),
  /**
   * If `true`, the select will be initially open.
   * @default false
   */
  defaultListboxOpen: PropTypes.bool,
  /**
   * The default selected value. Use when the component is not controlled.
   */
  defaultValue: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * If `true`, the select is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Controls the open state of the select's listbox.
   * @default undefined
   */
  listboxOpen: PropTypes.bool,
  /**
   * Callback fired when an option is selected.
   */
  onChange: PropTypes.func,
  /**
   * Callback fired when the component requests to be opened.
   * Use in controlled mode (see listboxOpen).
   */
  onListboxOpenChange: PropTypes.func,
  /**
   * Function that customizes the rendering of the selected value.
   */
  renderValue: PropTypes.func,
  /**
   * The selected value.
   * Set to `null` to deselect all options.
   */
  value: PropTypes /* @typescript-to-proptypes-ignore */.any,
} as any;

/**
 * The foundation for building custom-styled select components.
 *
 * Demos:
 *
 * - [Selects](https://mui.com/components/selects/)
 *
 * API:
 *
 * - [SelectUnstyled API](https://mui.com/api/select-unstyled/)
 */
export default SelectUnstyled as <TValue extends {}>(
  props: SelectUnstyledProps<TValue> & React.RefAttributes<HTMLElement>,
) => JSX.Element | null;
