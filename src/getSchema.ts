import { gql } from 'graphql-tag';

export default () => gql`
  scalar DateTime
  scalar JSONObject

  type Item @key(fields: "id") {
    id: ID!
    name: String
    description: String
    createdAt: DateTime
    updatedAt: DateTime
  }

  input UpdateItemInput {
    id: String!
    name: String
    ownerId: String!
    description: String
  }

  input QueryObject {
    ownerId: String
  }

  type Query {
    item(id: ID!): Item
    items(query: QueryObject!): [Item]
  }

  type Mutation {
    updateItem(input: UpdateItemInput!): Item
    createItem(name: String, description: String): Item
    deleteItem(id: String!): Item
  }
`;
