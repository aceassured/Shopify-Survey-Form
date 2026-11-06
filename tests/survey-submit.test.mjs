import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import { transform } from 'esbuild';

// Exercise the real UI handlers with Shopify and the hook runtime isolated.
const source = await readFile(new URL('../extensions/thank-you-survey/src/Checkout.jsx', import.meta.url), 'utf8');
const { code } = await transform(source, { loader: 'jsx', format: 'cjs', jsxFactory: 'h' });

async function mount(fetch) {
  const state = [];
  let cursor = 0;
  let tree;
  const h = (type, props, ...children) => ({ type, props: props || {}, children });
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return state[index] ??= { current: initial };
    },
  };
  const context = {
    module: { exports: {} }, h, fetch,
    document: { body: {} }, console: { error() {} },
    shopify: {
      orderConfirmation: { value: { order: { id: 'gid://shopify/Order/123' } } },
      buyerIdentity: { email: { value: 'buyer@example.com' } },
      shippingAddress: { value: { name: 'Test Buyer' } },
      shop: { myshopifyDomain: 'test.myshopify.com' },
    },
    require(name) {
      if (name === 'preact/hooks') return hooks;
      if (name === 'preact') return { render: vnode => { cursor = 0; tree = vnode.type(); } };
      if (name === '@shopify/ui-extensions/preact') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(code, context);
  const refresh = () => context.module.exports.default();
  await refresh();
  function find(type, node = tree) {
    if (!node || typeof node !== 'object') return undefined;
    return node.type === type ? node : node.children?.map(child => find(type, child)).find(Boolean);
  }
  return {
    refresh, find,
    async select() {
      find('s-choice-list').props.onChange({ currentTarget: { values: ['instagram'] } });
      await refresh();
    },
    async submit() { await find('s-button').props.onClick(); await refresh(); },
  };
}

test('empty selection gives feedback without sending a request', async () => {
  const ui = await mount(() => assert.fail('Unexpected request'));
  await ui.submit();
  assert.match(ui.find('s-banner').children.join(''), /select an option/);
});

test('selected answer and order details reach the production endpoint; success is shown', async () => {
  const ui = await mount(async (url, options) => {
    assert.equal(url, 'https://shopify-survey-form-vjh2.onrender.com/api/survey');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), {
      source: 'instagram', orderId: 'gid://shopify/Order/123',
      customerEmail: 'buyer@example.com', customerName: 'Test Buyer', shop: 'test.myshopify.com',
    });
    return { ok: true, json: async () => ({ success: true }) };
  });
  await ui.select();
  assert.equal(ui.find('s-choice-list').props.values[0], 'instagram');
  await ui.submit();
  assert.equal(ui.find('s-button'), undefined);
  assert.match(ui.find('s-text').children.join(''), /submitted successfully/);
});

for (const failure of ['network', 'http', 'rejected', 'invalid-json']) {
  test(`${failure} failure shows a retryable error, never false success`, async () => {
    let attempts = 0;
    const ui = await mount(async () => {
      if (++attempts > 1) return { ok: true, json: async () => ({ success: true }) };
      if (failure === 'network') throw new Error('offline');
      return { ok: failure !== 'http', json: async () => {
        if (failure === 'invalid-json') throw new SyntaxError('Invalid JSON');
        return { success: false };
      } };
    });
    await ui.select();
    await ui.submit();
    assert.match(ui.find('s-banner').children.join(''), /try submitting again/);
    assert.equal(ui.find('s-button').props.loading, false);
    await ui.submit();
    assert.equal(ui.find('s-button'), undefined);
  });
}

test('rapid clicks send only one pending submission', async () => {
  let finish;
  let calls = 0;
  const ui = await mount(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  await ui.select();
  const click = ui.find('s-button').props.onClick;
  const pending = click();
  await click();
  await ui.refresh();
  assert.equal(ui.find('s-button').props.disabled, true);
  assert.equal(calls, 1);
  finish({ ok: true, json: async () => ({ success: true }) });
  await pending;
});
