// import type { Entity } from 'dynamodb-toolbox';
import type { Model } from 'dynamoose/dist/Model';
import type { Item as DynamooseItem } from 'dynamoose/dist/Item';
import type {
  Context as LambdaContext,
  APIGatewayProxyEventV2,
  APIGatewayProxyEvent,
} from 'aws-lambda';

export type GatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;
export interface LambdaContextFunctionArgument {
  event: GatewayEvent;
  context: LambdaContext;
}

export type ItemType = {
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  name?: string;
  id: string;
};
export type Item = DynamooseItem & ItemType;

export type IdObject = {
  id: string;
};

export type Context = {
  Item: Model<Item>;
  ownerId?: string;
  event: any;
};

export type Token = {
  id: string;
  type: string; // magic | google | etc.
  email: string;
};

export type Affirmative = {
  ok: Boolean;
};
