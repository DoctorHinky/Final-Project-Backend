// Eigene einfache p-limit Alternative

export function limitConcurrency<T>(
  concurrency: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  let active = 0;

  return new Promise((resolve, reject) => {
    const runNext = () => {
      if (index === tasks.length && active === 0) {
        return resolve(results);
      }

      while (active < concurrency && index < tasks.length) {
        const currentIndex = index++;
        const task = tasks[currentIndex];

        active++;
        task()
          .then((result) => {
            results[currentIndex] = result;
            active--;
            runNext();
          })
          .catch(reject);
      }
    };

    runNext();
  });
}
