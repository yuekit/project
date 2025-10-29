import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifySwagger from '@fastify/swagger';

import { registerSessionRoutes } from './routes/session.js';

const buildServer = () => {
  const server = Fastify({
    logger: {
      level: 'info'
    }
  });

  server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Living Storybook API',
        version: '0.1.0'
      }
    }
  });

  server.register(fastifyWebsocket);
  server.register(registerSessionRoutes, { prefix: '/api/sessions' });

  return server;
};

const start = async () => {
  const server = buildServer();
  try {
    await server.listen({ port: 3333, host: '0.0.0.0' });
    server.log.info('Living Storybook API ready on http://localhost:3333');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export type ServerInstance = ReturnType<typeof buildServer>;
export { buildServer };
