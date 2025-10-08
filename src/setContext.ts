// import jwt from 'jsonwebtoken';
import { model } from 'dynamoose';
import type { BaseContext, ContextFunction } from '@apollo/server';
import type {
  LambdaContextFunctionArgument,
  Item as ItemType,
  Context,
  // Token
} from './types';
import ItemModel from './Item.schema';
import getEnv from './getEnv';

// type DecodedToken = {
//   iat: number;
//   exp: number;
// } & Token;

// sets the auth header so we can securely be logged in by the magic link
const setContext: ContextFunction<
  [LambdaContextFunctionArgument],
  BaseContext
> = async ({ event, context }): Promise<Context> => {
  context.callbackWaitsForEmptyEventLoop = false;

  // const [token] = (event.headers.cookie ?? '').split(';');
  // const { email, type, id } = jwt.verify(token, getEnv().jwtSecret) as DecodedToken;
  // TODO: EITHER: extract into authoriser that is run real high
  // TODO: OR:     just trust after auth/gateway to populate into headers so we trust those
  const { id } = event.headers;
  const Item = model<ItemType>(getEnv().tableName, ItemModel);

  return {
    ...context,
    ownerId: id,
    event,
    Item,
  };
};

export default setContext;
