// https://umijs.org/config/
import os from 'os';
import slash from 'slash2'; // @ts-ignore

import { IPlugin, IConfig } from 'umi-types';
import defaultSettings from './defaultSettings';
import webpackPlugin from './plugin.config';
const { pwa, primaryColor } = defaultSettings; // preview.pro.ant.design only do not use in your production ;
// preview.pro.ant.design 专用环境变量，请不要在你的项目中使用它。

const { ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION, TEST, NODE_ENV } = process.env;
const plugins: IPlugin[] = [
  ['umi-plugin-antd-icon-config', {}],
  [
    'umi-plugin-react',
    {
      antd: true,
      dva: {
        hmr: true,
      },
      locale: {
        // default false
        enable: true,
        // default zh-CN
        default: 'zh-CN',
        // default true, when it is true, will use `navigator.language` overwrite default
        baseNavigator: true,
      },
      dynamicImport: {
        loadingComponent: './components/PageLoading/index',
        webpackChunkName: true,
        level: 3,
      },
      pwa: pwa
        ? {
            workboxPluginMode: 'InjectManifest',
            workboxOptions: {
              importWorkboxFrom: 'local',
            },
          }
        : false,
      ...(!TEST && os.platform() === 'darwin'
        ? {
            dll: {
              include: ['dva', 'dva/router', 'dva/saga', 'dva/fetch'],
              exclude: ['@babel/runtime', 'netlify-lambda'],
            },
            hardSource: false,
          }
        : {}),
    },
  ],
  [
    'umi-plugin-pro-block',
    {
      moveMock: false,
      moveService: false,
      modifyRequest: true,
      autoAddMenu: true,
    },
  ],
]; // 针对 preview.pro.ant.design 的 GA 统计代码
// preview.pro.ant.design only do not use in your production ; preview.pro.ant.design 专用环境变量，请不要在你的项目中使用它。

if (ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site') {
  plugins.push([
    'umi-plugin-ga',
    {
      code: 'UA-72788897-6',
    },
  ]);
}

const uglifyJSOptions =
  NODE_ENV === 'production'
    ? {
        uglifyOptions: {
          // remove console.* except console.error
          compress: {
            drop_console: true,
            pure_funcs: ['console.error'],
          },
        },
      }
    : {};
export default {
  // add for transfer to umi
  plugins,
  define: {
    ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION:
      ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION || '', // preview.pro.ant.design only do not use in your production ; preview.pro.ant.design 专用环境变量，请不要在你的项目中使用它。
  },
  block: {
    defaultGitUrl: 'https://github.com/ant-design/pro-blocks',
  },
  treeShaking: true,
  targets: {
    ie: 11,
  },
  devtool: ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION ? 'source-map' : false,
  // 路由配置
  routes: [
    {
      path: '/',
      component: '../layouts/BasicLayout',
      Routes: ['src/pages/Authorized'],
      authority: ['admin', 'user'],
      routes: [
        {
          path: '/',
          redirect: '/resources/count',
          locale: 'menu',
        },
        {
          name: 'visualization',
          icon: 'bulb',
          hideInMenu: true,
          path: '/visualization',
          component: './visualization',
        },
        {
          path: '/transform',
          name: 'transform',
          exact: true,
          icon: 'ConsoleSql',
          component: './transform',
        },
        {
          path: '/resources',
          name: 'resources',
          icon: 'dashboard',
          routes: [
            {
              path: '/resources',
              name: 'resources',
              hideInMenu: true,
              component: './resources',
            },
            {
              path: '/resources/count',
              name: 'count',
              exact: true,
              icon: 'area-chart',
              component: './resources',
            },
            {
              path: '/resources/connection',
              name: 'connection',
              hideInMenu: false,
              exact: true,
              icon: 'database',
              component: './resources/connection',
            },
            {
              path: '/resources/connection/name/:id',
              name: 'name',
              hideInMenu: true,
              exact: true,
              icon: 'database',
              component: './resources/connection/name/[id]',
            },
            {
              path: '/resources/connection/name/:id/template/:nid',
              name: 'template',
              hideInMenu: true,
              exact: true,
              icon: 'database',
              component: './resources/connection/name/template/[nid]',
            },
            {
              path: '/resources/connection/name/:id/template/:nid/version/:vid',
              name: 'version',
              hideInMenu: true,
              exact: true,
              icon: 'database',
              component: './resources/connection/name/template/version/[vid]',
            },
            {
              path: '/resources/connector',
              name: 'connector',
              hideInMenu: false,
              exact: true,
              icon: 'Api',
              component: './resources/connector',
            },
            {
              path: '/resources/relationship',
              name: 'relationship',
              hideInMenu: true,
              exact: true,
              icon: 'api',
              component: './resources/relationship',
            },
            {
              path: '/resources/namespace',
              name: 'namespace',
              exact: true,
              icon: 'bars',
              component: './resources/namespace',
            },
            {
              path: '/resources/file',
              name: 'file',
              exact: true,
              icon: 'file',
              component: './resources/file',
            },
            {
              path: '/resources/resource',
              name: 'resource',
              exact: true,
              hideInMenu: true,
              icon: 'table',
              component: './resources/resource',
            },
            {
              path: '/resources/function',
              name: 'function',
              exact: true,
              icon: 'tool',
              component: './resources/functions',
            },
          ],
        },
        {
          name: 'login',
          icon: 'smile',
          hideInMenu: true,
          path: '/login',
          component: './login',
        },
        {
          path: '/job',
          name: 'job',
          exact: true,
          icon: 'Heart',
          component: './job',
        },
        {
          name: 'terminal',
          icon: 'profile',
          path: '/terminal',
          component: './terminal',
        },
        {
          name: 'terminal_detail',
          icon: 'profile',
          hideInMenu: true,
          path: '/terminal/:id',
          component: './terminal/[id]',
        },
        {
          name: 'log',
          icon: 'message',
          path: '/log',
          component: './log',
        },
      ],
    },
  ],
  // Theme for antd
  // https://ant.design/docs/react/customize-theme-cn
  theme: {
    'primary-color': primaryColor,
  },
  proxy: {
    '/api/': {
      target: 'http://localhost:8080/',
      changeOrigin: true,
      pathRewrite: {
        '^/server': '',
      },
    },
    '/upload/': {
      target: 'http://localhost:8080/',
      changeOrigin: true,
      pathRewrite: {
        '^/server': '',
      },
    },
  },
  ignoreMomentLocale: true,
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  disableRedirectHoist: true,
  cssLoaderOptions: {
    modules: true,
    getLocalIdent: (
      context: {
        resourcePath: string;
      },
      localIdentName: string,
      localName: string,
    ) => {
      if (
        context.resourcePath.includes('node_modules') ||
        context.resourcePath.includes('ant.design.pro.less') ||
        context.resourcePath.includes('global.less')
      ) {
        return localName;
      }

      const match = context.resourcePath.match(/src(.*)/);

      if (match && match[1]) {
        const antdProPath = match[1].replace('.less', '');
        const arr = slash(antdProPath)
          .split('/')
          .map((a: string) => a.replace(/([A-Z])/g, '-$1'))
          .map((a: string) => a.toLowerCase());
        return `antd-pro${arr.join('-')}-${localName}`.replace(/--/g, '-');
      }

      return localName;
    },
  },
  manifest: {
    basePath: '/',
  },
  publicPath: '/static/',
  uglifyJSOptions,
  chainWebpack: webpackPlugin,
} as IConfig;
