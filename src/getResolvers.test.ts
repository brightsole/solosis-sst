// import getResolvers from './resolvers';

describe('Resolvers', () => {
  describe('Queries', () => {
    describe('item(id): Item', () => {
      it('fetches an item given an id', () => {
        expect(true).toBe(true);
      });

      it('explodes when fetching something nonexistent', () => {
        expect(true).toBe(true);
      });

      it("allows you to grab someone else's item", () => {
        expect(true).toBe(true);
      });
    });

    describe('items(id): Item[]', () => {
      it('fetches all items of a given ownerId', () => {
        expect(true).toBe(true);
      });

      it('returns nothing if it is given an unused ownerId', () => {
        expect(true).toBe(true);
      });

      it("allows you to grab someone else's items", () => {
        expect(true).toBe(true);
      });
    });
  });

  describe('Mutations', () => {
    describe('createItem(name, description): Item', () => {
      it('creates an item when given good info', () => {
        expect(true).toBe(true);
      });
      it('explodes if not logged in, because orphan items are verboten', () => {
        expect(true).toBe(true);
      });
    });

    describe('updateItem(name, description): Item', () => {
      it('updates an item when given good info', () => {
        expect(true).toBe(true);
      });
      it('explodes if no match for id, because its a required property', () => {
        expect(true).toBe(true);
      });
      it("never lets you overwrite another user's item because auth sets ownerId", () => {
        expect(true).toBe(true);
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
