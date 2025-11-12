
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: './',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 24667, hash: '44b20ca75be5d4b4ee29f38e4bbb436fd2377d7899c67d08fcfcc065a30fac9d', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17120, hash: '59b577d8a5fe292523ead3edd7ea9750b7c153cac1c817faf550d0b3c96e841f', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 45969, hash: 'ae34d28bda3761e1730c01c12b08e52de37201c1893931cf9806d58b2aa05ade', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-YZOHQ4H6.css': {size: 8156, hash: 'IygWDm62hG8', text: () => import('./assets-chunks/styles-YZOHQ4H6_css.mjs').then(m => m.default)}
  },
};
