// Import the AWS SDK Secrets Manager client
import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { Context } from 'aws-lambda';
import pg from 'pg';

// Create an instance of the Secrets Manager client
const client = new SecretsManagerClient({ region: 'us-east-1' });

// Function to get a secret
const getSecret = async (secretName: string) => {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response: GetSecretValueCommandOutput = await client.send(command);
    console.log("Get Secret Response", response)
    if (response.SecretString){
        return JSON.parse(response.SecretString);
    }
    else{
        throw new Error('SecretString not found in this secret')
    }
  } catch (err) {
    console.error(`Failed to retrieve secret: ${err}`);
  }
};

export const handler = async (event: any, context: Context) => {
    console.log("EVENT: ", event)
    const clientQuery = event?.query || '';
    const secret: any = getSecret('wdh_main');
    const dbConfig = {
        user: secret.username,
        host: secret.host,
        database: secret.dbClusterIdentifier,
        password: secret.password,
        port: secret.port
        // Default port for PostgreSQL
    };
    const client = new pg.Client(dbConfig);
    try {
        await client.connect();
        const result = await client.query(clientQuery);
 
        console.log("DB QUERy RESULT: ", result)
        return result?.rows || [];
    } catch (error) {
        console.error("Database connection error:", error);
        return error;
    } finally {
        await client.end();
    }
  };