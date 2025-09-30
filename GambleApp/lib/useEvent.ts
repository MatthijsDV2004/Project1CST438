import { useEffect } from "react";
import emitter, { Events } from "./eventBus";

export function useEvent<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void
) {
  useEffect(() => {
    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [event, handler]);
}
