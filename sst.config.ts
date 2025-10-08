/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'items-service',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
    };
  },
  async run() {
    const itemsTable = new sst.aws.Dynamo('ItemsTable', {
      fields: {
        id: 'string',
        ownerId: 'string',
      },
      primaryIndex: { hashKey: 'id' },
      globalIndexes: {
        ownerId: { hashKey: 'ownerId' },
      },
      deletionProtection: $app.stage === 'production',
    });

    const api = new sst.aws.ApiGatewayV2('Api', {
      link: [itemsTable],
    });

    api.route('ANY /', {
      handler: 'src/server.handler',
      runtime: 'nodejs18.x',
      timeout: '20 seconds',
      memory: '1024 MB',
      nodejs: {
        format: 'esm',
      },
      environment: {
        TABLE_NAME: itemsTable.name,
      },
    });

    return {
      apiUrl: api.url,
      usersTableName: itemsTable.name,
    };
  },
});
