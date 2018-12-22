My utility functions for creating reducers in a typesafe way.

## Design goals

1. Support a feature-oriented architecture where action types are decoupled from
   the state updating logic.

   - This allows for use case where a feature can export an action type for
     other features to listen to in their own reducer.

2. All type checking is done at compile time, so that runtime code is as small
   and fast as possible.

3. Provide type-safety while requiring as little type annotation as possible.

4. Facilitate IntelliSense and auto-completion.

5. Reduce boilerplate.

##
