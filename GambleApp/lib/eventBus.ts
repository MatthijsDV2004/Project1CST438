import mitt from "mitt";

export type Events = {
  "bet-placed": void;
};

const emitter = mitt<Events>();
export default emitter;
