import { Condition } from 'dynamoose';
import { GraphQLDateTime, GraphQLJSONObject } from 'graphql-scalars';
import { nanoid } from 'nanoid';
import { Context, IdObject, ItemType } from './types';

export default () => ({
  Query: {
    item: async (_: any, { id }: { id: string }, { Item }: Context) => Item.get({ id }),
    // for extra security, we could ignore the props passed in, and instead only grab items that bolong to
    // the ownerId passed in the headers. This could also be overly limiting if items aren't private
    items: async (_: any, { ownerId }: { ownerId: string }, { Item }: Context) =>
      Item.query('ownerId').eq(ownerId).using('ownerId').exec(),
  },

  Mutation: {
    createItem: async (
      _: any,
      { name, description }: { name?: string; description?: string },
      { ownerId, Item }: Context
    ): Promise<ItemType> => Item.create({ id: nanoid(), name, description, ownerId }),

    updateItem: async (
      _: any,
      { input: partialItem }: { input: Partial<ItemType> },
      { ownerId, Item }: Context
    ): Promise<ItemType | undefined> => Item.update({ ...partialItem, ownerId }),

    deleteItem: async (_: any, { id }: IdObject, { ownerId, Item }: Context): Promise<void> =>
      Item.delete(id, { condition: new Condition().where('ownerId').eq(ownerId) }),
  },

  Item: {
    // for finding out the info of the other items in the system
    __resolveReference: async ({ id }: IdObject, { Item }: Context) => Item.get(id),
  },

  DateTime: GraphQLDateTime,
  JSONObject: GraphQLJSONObject,
});
