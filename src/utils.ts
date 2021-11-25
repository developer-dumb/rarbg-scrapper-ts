export function promiseAwait(millis: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, millis);
  });
}
