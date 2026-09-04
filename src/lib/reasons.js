/* The one list of skip reasons, shared by the check-in card and the
   catch-up prompt so they can never drift apart.

   `other` is the open one: picking it reveals a short free-text field
   (stored as `day.reasonText`). The rest are one tap and done.

   Order matters — it's the on-screen order, roughly most to least common.
   Adding a reason here is safe; renaming an `id` is not (old days keep the
   old string). `insights.js` decides separately which of these it has
   something kind to say about. */

export const REASONS = [
  { id: 'busy', label: 'Busy' },
  { id: 'notfeelingit', label: 'Not feeling it' },
  { id: 'injured', label: 'Injured / unwell' },
  { id: 'unplanned', label: 'Unplanned rest' },
  { id: 'other', label: 'Other' },
];

/** Picking this reason opens the free-text field. */
export const CUSTOM_REASON = 'other';
