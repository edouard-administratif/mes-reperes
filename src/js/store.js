export function createStore(repository) {
  let notebook = repository.read();
  let queue = Promise.resolve();

  function update(change) {
    const operation = queue.then(async () => {
      const draft = structuredClone(notebook);
      const result = change(draft);
      const committed = await repository.write(draft);
      notebook = committed;
      return result;
    });
    // A failed operation must not prevent later saves.
    queue = operation.catch(() => {});
    return operation;
  }

  return { snapshot: () => structuredClone(notebook), update };
}
