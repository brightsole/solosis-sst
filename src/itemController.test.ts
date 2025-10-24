import { ModelType, Item } from './types';
import { Query as QueryType } from 'dynamoose/dist/ItemRetriever';

type ItemModelMock = jest.Mocked<ModelType & QueryType<Item>>;

let createItemController: (typeof import('./itemController'))['createItemController'];

beforeEach(async () => {
  jest.resetModules();
  ({ createItemController } = await import('./itemController'));
});

const createItemModelMock = (
  overrides: Partial<ItemModelMock> = {},
): ItemModelMock => {
  return {
    get: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    using: jest.fn().mockReturnThis(),
    exec: jest.fn().mockReturnThis(),
    create: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    ...overrides,
  } as ItemModelMock; // the item is partial, which spooks ts
};

describe('item controller', () => {
  describe('.get(itemId): Item', () => {
    it('fetches an item given an id', async () => {
      const Item = createItemModelMock({
        get: jest.fn().mockResolvedValue({ id: 'niner' }),
      });

      const item = await createItemController(Item).getById('niner');
      expect(item).toEqual({ id: 'niner' });
    });

    it('returns a cached item without hitting the database twice', async () => {
      const Item = createItemModelMock({
        get: jest
          .fn()
          .mockResolvedValue({ id: 'cached', owner: 'you', name: 'Cachey' }),
      });

      const controller = createItemController(Item);
      const first = await controller.getById('cached');
      const second = await controller.getById('cached');

      expect(first).toEqual({ id: 'cached', owner: 'you', name: 'Cachey' });
      expect(second).toEqual(first);
      expect(Item.get).toHaveBeenCalledTimes(1);
    });

    it('returns undefined when fetching something nonexistent', async () => {
      const Item = createItemModelMock({
        get: jest.fn().mockResolvedValue(undefined),
      });

      const item = await createItemController(Item).getById('niner');
      expect(item).toEqual(undefined);
    });

    it("allows you to grab someone else's item", async () => {
      const Item = createItemModelMock({
        get: jest.fn().mockResolvedValue({ id: 'niner', owner: 'not-you' }),
      });

      const item = await createItemController(Item).getById('niner');
      expect(item).toEqual({ id: 'niner', owner: 'not-you' });
    });
  });

  describe('.listByOwner(ownerId): Item[]', () => {
    it('fetches all items of a given ownerId', async () => {
      const Item = createItemModelMock({
        exec: jest.fn().mockResolvedValue([
          { id: 'niner', owner: 'you' },
          { id: 'five', owner: 'you' },
        ]),
      });

      const items = await createItemController(Item).listByOwner('you');
      expect(items).toEqual([
        { id: 'niner', owner: 'you' },
        { id: 'five', owner: 'you' },
      ]);
    });

    it('returns nothing if it is given an unused ownerId', async () => {
      const Item = createItemModelMock({
        exec: jest.fn().mockResolvedValue([]),
      });

      const items = await createItemController(Item).listByOwner('someguy');
      expect(items).toEqual([]);
    });

    it("allows you to grab someone else's items", async () => {
      const Item = createItemModelMock({
        exec: jest.fn().mockResolvedValue([
          { id: 'niner', owner: 'not-you' },
          { id: 'five', owner: 'not-you' },
        ]),
      });

      const items = await createItemController(Item).listByOwner('not-you');
      expect(items).toEqual([
        { id: 'niner', owner: 'not-you' },
        { id: 'five', owner: 'not-you' },
      ]);
    });
  });

  describe('.create(Partial<Item>, ownerId): Item', () => {
    it('creates an item when given good info', async () => {
      const Item = createItemModelMock({
        create: jest.fn().mockResolvedValue({
          id: 'niner',
          name: 'Niner',
          ownerId: 'yourself',
          description: 'My favorite number',
        }),
      });

      const item = await createItemController(Item).create(
        { name: 'Niner', description: 'My favorite number' },
        'yourself',
      );
      expect(item).toEqual({
        id: 'niner',
        name: 'Niner',
        ownerId: 'yourself',
        description: 'My favorite number',
      });
      expect(Item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Niner',
          description: 'My favorite number',
          ownerId: 'yourself',
        }),
        {
          overwrite: false,
        },
      );
    });

    it('explodes if not logged in, because orphan items are verboten', async () => {
      const Item = createItemModelMock({
        create: jest.fn(),
      });

      await expect(
        createItemController(Item).create({
          name: 'Niner',
          description: 'My favorite number',
        }),
      ).rejects.toThrow('Unauthorized');
      expect(Item.create).not.toHaveBeenCalled();
    });
  });

  describe('.update(Partial<Item>, ownerId): Item', () => {
    it('updates an item when given good info', async () => {
      const Item = createItemModelMock({
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
      });

      const item = await createItemController(Item).update(
        {
          id: 'niner',
          name: 'Niner',
          description: 'My favorite number',
        },
        'yourself',
      );
      expect(item).toEqual({
        id: 'niner',
        name: 'Niner',
        ownerId: 'yourself',
        description: 'My favorite number',
      });
      expect(Item.update).toHaveBeenCalledWith(
        { id: 'niner' },
        {
          description: 'My favorite number',
          name: 'Niner',
          ownerId: 'yourself',
        },
        expect.objectContaining({ returnValues: 'ALL_NEW' }),
      );
      expect(Item.update.mock.calls[0][2].condition).toBeDefined();
      expect(Item.update.mock.calls[0][2].condition?.constructor?.name).toBe(
        'Condition',
      );
    });

    it('explodes if no match for id, because its a required property', async () => {
      const Item = createItemModelMock({
        update: jest
          .fn()
          .mockRejectedValue(new Error('ConditionalCheckFailedException')),
      });

      await expect(
        createItemController(Item).update(
          {
            id: 'niner',
            name: 'Niner',
            description: 'My favorite number',
          },
          'yourself',
        ),
      ).rejects.toThrow('ConditionalCheckFailedException');
      expect(Item.update).toHaveBeenCalledWith(
        { id: 'niner' },
        {
          description: 'My favorite number',
          name: 'Niner',
          ownerId: 'yourself',
        },
        expect.objectContaining({ returnValues: 'ALL_NEW' }),
      );
      expect(Item.update.mock.calls[0][2].condition).toBeDefined();
      expect(Item.update.mock.calls[0][2].condition?.constructor?.name).toBe(
        'Condition',
      );
    });

    it("never lets you overwrite another user's item because auth sets ownerId", async () => {
      const Item = createItemModelMock({
        update: jest
          .fn()
          .mockRejectedValue(new Error('ConditionalCheckFailedException')),
      });

      await expect(
        createItemController(Item).update(
          {
            id: 'niner',
            name: 'Niner',
            description: 'My favorite number',
          },
          'yourself',
        ),
      ).rejects.toThrow('ConditionalCheckFailedException');
    });
  });

  describe('.deleteItem(itemId): Affirmative', () => {
    it('deletes an item when given good info', async () => {
      const Item = createItemModelMock({
        delete: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        createItemController(Item).remove('niner', 'yourself'),
      ).resolves.toEqual({ ok: true });

      expect(Item.delete).toHaveBeenCalledWith(
        'niner',
        expect.objectContaining({ condition: expect.anything() }),
      );
      expect(Item.delete.mock.calls[0][1].condition).toBeDefined();
      expect(Item.delete.mock.calls[0][1].condition?.constructor?.name).toBe(
        'Condition',
      );
    });

    it("explodes if the auth owner id doesn't match the target item", async () => {
      const Item = createItemModelMock({
        delete: jest
          .fn()
          .mockRejectedValue(new Error('ConditionalCheckFailedException')),
      });

      await expect(
        createItemController(Item).remove('niner', 'yourself'),
      ).rejects.toThrow('ConditionalCheckFailedException');

      expect(Item.delete).toHaveBeenCalledWith(
        'niner',
        expect.objectContaining({ condition: expect.anything() }),
      );
      expect(Item.delete.mock.calls[0][1].condition).toBeDefined();
      expect(Item.delete.mock.calls[0][1].condition?.constructor?.name).toBe(
        'Condition',
      );
    });
  });
});
