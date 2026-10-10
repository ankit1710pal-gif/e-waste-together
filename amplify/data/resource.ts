import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { workflow } from '../functions/workflow/resource';
// No unrestricted model writes. Every state change passes server validation.
const schema = a.schema({
  dashboard: a.query().returns(a.string()).authorization(allow => [allow.groups(['IIITM_MEMBERS', 'IIITM_ORGANISERS'])]).handler(a.handler.function(workflow)),
  act: a.mutation().arguments({ payload: a.string().required(), actionId: a.string().required(), revision: a.integer().required() }).returns(a.string()).authorization(allow => [allow.groups(['IIITM_MEMBERS', 'IIITM_ORGANISERS'])]).handler(a.handler.function(workflow)),
  fileAccess: a.mutation().arguments({ payload: a.string().required() }).returns(a.string()).authorization(allow => [allow.groups(['IIITM_MEMBERS', 'IIITM_ORGANISERS'])]).handler(a.handler.function(workflow)),
});
export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema, authorizationModes: { defaultAuthorizationMode: 'userPool' } });
