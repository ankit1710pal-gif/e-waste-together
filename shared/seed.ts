import { initialState, type State } from './domain';
export const demoActors = {
  resident: { id: 'demo-asha', role: 'resident' as const, community: 'iiitm-gwalior' },
  neighbour: { id: 'demo-kabir', role: 'resident' as const, community: 'iiitm-gwalior' },
  organiser: { id: 'demo-organiser', role: 'organiser' as const, community: 'iiitm-gwalior' },
};
export function seed(): State {
  const state = initialState(true);
  state.drive.proposedDate = '2026-10-18T10:00';
  state.requests = [
    { id: 'sample-request-01', owner: 'demo-asha', category: 'Phones', count: 2, estimatedKg: .4, contact: 'Sample campus email', note: 'Two old phones. Screens intact.', status: 'Submitted', reviewNote: '', received: 0, createdAt: '2026-10-10T08:30:00.000Z' },
    { id: 'sample-request-02', owner: 'demo-kabir', category: 'Cables & chargers', count: 6, estimatedKg: 1.2, contact: 'Sample campus email', note: 'Mixed charging cables and adapters.', status: 'Accepted', reviewNote: 'Sample eligibility review.', received: 0, createdAt: '2026-10-10T08:00:00.000Z' },
    { id: 'sample-request-03', owner: 'demo-meera', category: 'Computers', count: 1, estimatedKg: 2.4, contact: 'Sample campus email', note: 'Old laptop, battery condition unknown.', status: 'Needs clarification', reviewNote: 'Please check the battery condition before confirmation.', received: 0, createdAt: '2026-10-10T07:30:00.000Z' },
  ];
  return state;
}
