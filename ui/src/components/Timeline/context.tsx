import { FC, createContext, Dispatch, useContext } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { Layout } from './types';
import { State, Action, useTimelineState } from './state';

const TimelineStateContext = createContext<State | null>(null);
const TimelineStateDispatchContext = createContext<Dispatch<Action> | null>(
  null
);

export function useTimelineContext() {
  const state = useContext(TimelineStateContext);
  const dispatch = useContext(TimelineStateDispatchContext);

  if (state === null || dispatch === null) {
    throw Error('Timeline context has not been provided.');
  }

  return [state, dispatch] as const;
}

type TimelineContextProviderProps = {
  entities: Array<Entity>;
  layout: Layout;
};

const TimelineContextProvider: FC<TimelineContextProviderProps> = ({
  children,
  entities,
  layout,
}) => {
  const [state, dispatch] = useTimelineState(entities, layout);

  return (
    <TimelineStateContext.Provider value={state}>
      <TimelineStateDispatchContext.Provider value={dispatch}>
        {children}
      </TimelineStateDispatchContext.Provider>
    </TimelineStateContext.Provider>
  );
};

export { TimelineContextProvider };
