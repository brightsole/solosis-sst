import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { buildSubgraphSchema } from '@apollo/subgraph';
import getResolvers from '../src/getResolvers';
import getTypeDefs from '../src/getSchema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (_context: any = {}) =>
  new ApolloServer<typeof _context>({
    schema: buildSubgraphSchema([
      {
        typeDefs: getTypeDefs(),
        resolvers: getResolvers(),
      },
    ]),

    plugins: [ApolloServerPluginInlineTraceDisabled()],
  });
