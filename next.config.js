const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  {
    reactStrictMode: false,
    env: {
      MAINNET_PRIMARY: process.env.MAINNET_PRIMARY,
      BASE_CLUSTER: process.env.BASE_CLUSTER,
      NEXT_PUBLIC_BASE_URL:
        process.env.NEXT_PUBLIC_BASE_URL || 'https://identity.cardinal.so',
    },
    webpack: (config) => {
      // Unset client-side javascript that only works server-side
      config.resolve.fallback = { fs: false, module: false, path: false }
      return config
    },
  },
  {
    // Additional config options for the Sentry Webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, org, project, authToken, configFile, stripPrefix,
    //   urlPrefix, include, ignore

    silent: true, // Suppresses all logs
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
  }
)
