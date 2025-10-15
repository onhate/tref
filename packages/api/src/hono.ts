import type { User } from '@/auth/auth';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { Session } from 'better-auth/types';
import type { ApiGatewayRequestContextV2, LambdaContext } from 'hono/aws-lambda';

export interface Variables {
  user?: User;
  session?: Session;
}

export type Bindings = {
  event: APIGatewayProxyEventV2
  lambdaContext: LambdaContext,
  requestContext: ApiGatewayRequestContextV2
}

export type HonoEnv = {
  Bindings: Bindings,
  Variables: Variables
}
