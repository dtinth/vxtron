import produce, { Draft } from 'immer'

export function actionTypes<T extends { [K: string]: any }>(
  spec: { [K in keyof T]: ActionType<T[K]> }
): ActionTypes<T> {
  const out: any = {}
  for (const key of Object.keys(spec)) {
    out[key] = spec[key].bindName(key)
  }
  return out
}

export function actionType<T extends {}>(): ActionType<T> {
  return {
    bindName(name) {
      return Object.assign((payload: T) => ({ type: name, ...payload }), {
        actionType: name
      })
    }
  }
}

export function actionHandler<S = any, A = any>(initialState?: S, spec = {}) {
  return {
    handle<N extends A, T>(
      actionConstructor: ActionConstructor<N, T>,
      handler: (state: Draft<S>, payload: T & { type: N }) => void
    ) {
      return actionHandler<S, Exclude<A, N>>(initialState, {
        ...spec,
        [actionConstructor.actionType as any]: handler
      })
    },
    toReducer(): (state: S, action: any) => S {
      return (state, action) => {
        const handler = (spec as any)[action.type]
        if (typeof handler === 'function') {
          return produce<S>(state, draft => handler(draft, action))
        } else {
          return state
        }
      }
    }
  }
}

export type ActionTypes<T> = { [K in keyof T]: ActionConstructor<K, T[K]> }

export interface ActionType<T> {
  bindName<N>(name: N): ActionConstructor<N, T>
}

export interface ActionConstructor<N, T> {
  (data: T): T & { type: N }
  actionType: N
}
