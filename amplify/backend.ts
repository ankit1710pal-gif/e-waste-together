import { defineBackend } from "@aws-amplify/backend";
import { Stack, RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  Table,
  TableEncryption,
} from "aws-cdk-lib/aws-dynamodb";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { workflow } from "./functions/workflow/resource";
const backend = defineBackend({ auth, data, storage, workflow });
const lambda = backend.workflow.resources.lambda;
// Same stack as the workflow avoids a cross-stack Data dependency cycle.
const table = new Table(Stack.of(lambda), "CampusPilotState", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  encryption: TableEncryption.AWS_MANAGED,
  pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
  removalPolicy: RemovalPolicy.RETAIN,
  // Only upload quota rows have this field; the workflow item never expires.
  timeToLiveAttribute: "expiresAt",
});
table.grantReadWriteData(lambda);
backend.storage.resources.bucket.grantReadWrite(lambda);
// Expire abandoned temporary uploads, never the linked private documents.
backend.storage.resources.cfnResources.cfnBucket.lifecycleConfiguration = {
  rules: [
    {
      id: "AbandonedUploads",
      status: "Enabled",
      prefix: "pending/",
      expirationInDays: 7,
    },
    {
      id: "IncompleteUploads",
      status: "Enabled",
      abortIncompleteMultipartUpload: { daysAfterInitiation: 1 },
    },
  ],
};
backend.workflow.addEnvironment("STATE_TABLE", table.tableName);
backend.workflow.addEnvironment(
  "FILES_BUCKET",
  backend.storage.resources.bucket.bucketName,
);
backend.addOutput({
  custom: { community: "iiitm-gwalior", stateTable: table.tableName },
});
