import { defineAuth } from '@aws-amplify/backend';
export const auth = defineAuth({ loginWith: { email: true }, groups: ['IIITM_MEMBERS', 'IIITM_ORGANISERS'] });
