import { defineStorage } from '@aws-amplify/backend';
// Clients get no direct bucket access; Lambda issues record-scoped expiring URLs.
export const storage = defineStorage({ name: 'campusPrivateFiles' });
