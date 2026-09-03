/** A unique-enough id for list keys and stored records. */
export const newId = () =>
  crypto.randomUUID?.() ?? String(Date.now() + Math.random());
