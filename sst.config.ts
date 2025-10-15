/// <reference path="./.sst/platform/config.d.ts" />

type DevCommands = {
  databaseUrl: $util.Output<string>,
  router: sst.aws.Router,
  authSecret: sst.Secret,
};

function createVpc() {
  const vpc = new sst.aws.Vpc('Vpc', {
    az: 2,
    nat: 'ec2'
  });
  return { vpc };
}

function createDatabase({ vpc }: { vpc: sst.aws.Vpc }) {
  const database = new sst.aws.Postgres('Database', {
    vpc,
    proxy: true,
    dev: {
      username: 'postgres',
      password: 'password',
      database: 'local',
      port: 5434
    }
  });
  const databaseUrl = $interpolate`postgresql://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`;
  return { database, databaseUrl };
}

function createBucket() {
  const bucket = new sst.aws.Bucket('Bucket', {
    access: 'cloudfront'
  });
  return { bucket };
}

function createSecrets() {
  const authSecret = new sst.Secret('AuthSecret', 'better-auth#placeholder#1234567890');
  return { authSecret };
}

function createEmail() {
  const email = sst.aws.Email.get('Email', 'xxx.email');
  return { email };
}

function devCommands(input: DevCommands) {
  const { databaseUrl, authSecret } = input;

  new sst.x.DevCommand('ApiTypesCheck', {
    dev: {
      title: '🔄 Api Types Check',
      autostart: true,
      directory: 'packages/api',
      command: `pnpm types --watch`
    }
  });

  new sst.x.DevCommand('Shell', {
    link: [authSecret],
    dev: {
      title: '🚀 Shell',
      autostart: false,
      command: 'sst print-and-not-quit'
    },
    environment: {
      DATABASE_URL: databaseUrl
    }
  });
}

export default $config({
  app(input) {
    const isProduction = input?.stage === 'xproduction';
    return {
      name: 'myapp',
      removal: isProduction ? 'retain' : 'remove',
      protect: isProduction,
      home: 'aws',
      providers: {
        aws: {
          profile: 'm2o',
          region: 'sa-east-1'
        }
      }
    };
  },
  async run() {
    const { vpc } = createVpc();
    const { database, databaseUrl } = createDatabase({ vpc });
    const { bucket } = createBucket();
    const { authSecret } = createSecrets();
    // const { email } = createEmail();

    const router = new sst.aws.Router('Router', {});
    router.routeBucket('/public/*', bucket);

    new sst.aws.Function('Api', {
      vpc,
      handler: 'packages/api/src/httpHandler.handler',
      runtime: 'nodejs22.x',
      architecture: 'arm64',
      timeout: '90 seconds',
      memory: '2048 MB',
      url: {
        cors: false,
        router: {
          instance: router,
          path: '/api'
        }
      },
      link: [database, bucket, authSecret],
      environment: {
        DATABASE_URL: databaseUrl,
        API_URL: router.url,
        APP_URL: router.url,
        NODE_ENV: $dev ? 'development' : 'production'
      }
    });

    new sst.aws.Nextjs('Web', {
      path: './packages/app',
      router: {
        instance: router
      },
      link: [
        router
      ],
      environment: {
        NEXT_PUBLIC_API_URL: router.url,
        NEXT_PUBLIC_APP_URL: $dev ? 'http://localhost:3000' : router.url
      },
      server: {
        runtime: 'nodejs22.x',
        architecture: 'arm64',
        timeout: '60 seconds',
        memory: '2048 MB'
      }
    });

    devCommands({
      databaseUrl,
      authSecret,
      router
    });

    return {
      Router: router.url
    };
  }
});
