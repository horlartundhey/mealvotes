// Injectable clock so deadline and cooldown logic can be tested without waiting for real time.
let source: () => Date = () => new Date();

export const now = () => source();
export const setClock = (fn: () => Date) => {
  source = fn;
};
export const resetClock = () => {
  source = () => new Date();
};
