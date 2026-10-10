import { defineFunction } from '@aws-amplify/backend';
export const workflow = defineFunction({ name: 'campus-workflow', entry: './handler.ts', resourceGroupName: 'data', timeoutSeconds: 30 });
