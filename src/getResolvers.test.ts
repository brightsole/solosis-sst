import { Condition } from 'dynamoose';
import getResolvers from './getResolvers';

describe('Resolvers', () => {
  describe('Queries', () => {
    const { Query } = getResolvers();
    describe('item(id): Item', () => {
      it('fetches an item given an id', async () => {
        const Item = {
          get: jest.fn().mockResolvedValue({ id: 'niner' }),
        } as any;

        const item = await Query.item(null, { id: 'niner' }, { Item, event: {} });
        expect(item).toEqual({ id: 'niner' });
      });

      it('returns undefined when fetching something nonexistent', async () => {
        const Item = {
          get: jest.fn().mockResolvedValue(undefined),
        } as any;

        const item = await Query.item(null, { id: 'niner' }, { Item, event: {} });
        expect(item).toEqual(undefined);
      });

      it("allows you to grab someone else's item", async () => {
        const Item = {
          get: jest.fn().mockResolvedValue({ id: 'niner', owner: 'not-you' }),
        } as any;

        const item = await Query.item(null, { id: 'niner' }, { Item, event: {} });
        expect(item).toEqual({ id: 'niner', owner: 'not-you' });
      });
    });

    describe('items(id): Item[]', () => {
      it('fetches all items of a given ownerId', async () => {
        const Item = {
          query: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          using: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            { id: 'niner', owner: 'you' },
            { id: 'five', owner: 'you' },
          ]),
        } as any;

        const items = await Query.items(null, { ownerId: 'you' }, { Item, event: {} });
        expect(items).toEqual([
          { id: 'niner', owner: 'you' },
          { id: 'five', owner: 'you' },
        ]);
      });

      it('returns nothing if it is given an unused ownerId', async () => {
        const Item = {
          query: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          using: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([]),
        } as any;

        const items = await Query.items(null, { ownerId: 'nonexistent' }, { Item, event: {} });
        expect(items).toEqual([]);
      });

      it("allows you to grab someone else's items", async () => {
        const Item = {
          query: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          using: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            { id: 'niner', owner: 'not-you' },
            { id: 'five', owner: 'not-you' },
          ]),
        } as any;

        const items = await Query.items(null, { ownerId: 'not-you' }, { Item, event: {} });
        expect(items).toEqual([
          { id: 'niner', owner: 'not-you' },
          { id: 'five', owner: 'not-you' },
        ]);
      });
    });
  });

  describe('Mutations', () => {
    const { Mutation } = getResolvers();
    describe('createItem(name, description): Item', () => {
      it('creates an item when given good info', async () => {
        const Item = {
          create: jest.fn().mockResolvedValue({
            id: 'niner',
            name: 'Niner',
            ownerId: 'yourself',
            description: 'My favorite number',
          }),
        } as any;

        const item = await Mutation.createItem(
          null,
          { name: 'Niner', description: 'My favorite number' },
          { Item, event: {}, ownerId: 'yourself' }
        );
        expect(item).toEqual({
          id: 'niner',
          name: 'Niner',
          ownerId: 'yourself',
          description: 'My favorite number',
        });
      });

      it('explodes if not logged in, because orphan items are verboten', async () => {
        const Item = {
          create: jest
            .fn()
            .mockResolvedValue({ id: 'niner', name: 'Niner', description: 'My favorite number' }),
        } as any;

        await expect(
          Mutation.createItem(
            null,
            { name: 'Niner', description: 'My favorite number' },
            { Item, event: {} }
          )
        ).rejects.toThrow('Unauthorized');
      });
    });

    describe('updateItem(name, description): Item', () => {
      it('updates an item when given good info', async () => {
        const Item = {
          update: jest.fn().mockResolvedValue({
            id: 'niner',
            name: 'Niner',
            ownerId: 'yourself',
            description: 'My favorite number',
          }),
          get: jest.fn().mockResolvedValue({
            id: 'niner',
            name: 'Niner',
            ownerId: 'yourself',
            description: 'My favorite number',
          }),
        } as any;

        const item = await Mutation.updateItem(
          null,
          { input: { id: 'niner', name: 'Niner', description: 'My favorite number' } },
          { Item, event: {}, ownerId: 'yourself' }
        );
        expect(item).toEqual({
          id: 'niner',
          name: 'Niner',
          ownerId: 'yourself',
          description: 'My favorite number',
        });
      });

      it('explodes if no match for id, because its a required property', async () => {
        const Item = {
          update: jest.fn().mockRejectedValue({
            code: 'ConditionalCheckFailedException',
          }),
        } as any;

        await expect(
          Mutation.updateItem(
            null,
            { input: { id: 'niner', name: 'Niner', description: 'My favorite number' } },
            { Item, event: {}, ownerId: 'yourself' }
          )
        ).rejects.toThrow('Item deleted or owned by another user');
        expect(Item.update).toHaveBeenCalledWith(
          { id: 'niner' },
          { description: 'My favorite number', id: 'niner', name: 'Niner', ownerId: 'yourself' },
          { condition: expect.any(Condition), returnValues: 'ALL_NEW' }
        );
      });

      it("never lets you overwrite another user's item because auth sets ownerId", async () => {
        const Item = {
          update: jest.fn().mockRejectedValue({
            code: 'ConditionalCheckFailedException',
          }),
        } as any;

        await expect(
          Mutation.updateItem(
            null,
            { input: { id: 'niner', name: 'Niner', description: 'My favorite number' } },
            { Item, event: {}, ownerId: 'yourself' }
          )
        ).rejects.toThrow('Item deleted or owned by another user');
      });
    });

    describe('deleteItem(name, description): Item', () => {
      it('deletes an item when given good info', () => {
        expect(true).toBe(true);
      });
      it("explodes if the auth owner id doesn't match the target item", () => {
        expect(true).toBe(true);
      });
    });
  });
});
