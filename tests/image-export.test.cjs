const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const png = fs.readFileSync(path.join(root, 'assets/frames/frame-1.png'));

function setup({ readFailure = false, decodeFailure = false, exportFailure = false } = {}) {
  const nodes = new Map();
  const revoked = [];
  const downloads = [];
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      handlers: {}, addEventListener(event, handler) { this.handlers[event] = handler; },
      showModal() { this.open = true; }, querySelector() { return {}; }
    });
    return nodes.get(id);
  };
  const ctx = new Proxy({}, { get: (_, key) => () => {}, set: () => true });
  node('preview').getContext = () => ctx;
  node('preview').toBlob = (callback, type) => {
    assert.equal(type, 'image/png');
    callback(exportFailure ? null : new Blob([png], { type }));
  };
  class Reader {
    readAsDataURL(blob) {
      blob.arrayBuffer().then(buffer => {
        if (readFailure) { this.onerror(); return; }
        this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
        this.onload();
      });
    }
  }
  class Image {
    set src(value) {
      queueMicrotask(() => decodeFailure && value.startsWith('data:') ? this.onerror() : this.onload());
    }
  }
  const sandbox = {
    document: { getElementById: node, querySelectorAll: () => [] },
    window: { addEventListener() {}, PointerEvent: true },
    HTMLDialogElement: { prototype: { showModal() {} } },
    URL: { createObjectURL(blob) { downloads.push(blob); return `blob:test-${downloads.length}`; },
      revokeObjectURL(value) { revoked.push(value); } },
    Image, FileReader: Reader,
    constrain: x => x, imageRect: () => ({ x: 0, y: 0, width: 1024, height: 1024 }),
    queueMicrotask
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/^import .*;\r?\n/, '').replace(/init\(\);\s*$/, '');
  vm.runInContext(source, sandbox);
  vm.runInContext('avatar = { width: 1024, height: 1024 }; frame = {};', sandbox);
  return { node, revoked, downloads, generate: () => node('generate').handlers.click() };
}

test('save preview embeds exact PNG bytes while download keeps the original Blob', async () => {
  const app = setup();
  await app.generate();
  const src = app.node('result-image').src;
  assert.match(src, /^data:image\/png;base64,/);
  assert.deepEqual(Buffer.from(src.split(',')[1], 'base64'), png);
  assert.match(app.node('download').href, /^blob:/);
  assert.deepEqual(Buffer.from(await app.downloads[0].arrayBuffer()), png);
  assert.equal(app.node('result-dialog').open, true);
  assert.equal(app.node('generate').disabled, false);
});
test('regeneration replaces download URL without revoking embedded save data', async () => {
  const app = setup();
  await app.generate();
  await app.generate();
  assert.deepEqual(app.revoked, ['blob:test-1']);
  assert.equal(app.node('download').href, 'blob:test-2');
  assert.match(app.node('result-image').src, /^data:image\/png;base64,/);
});
for (const [name, option] of [['export', 'exportFailure'], ['read', 'readFailure'], ['decode', 'decodeFailure']]) {
  test(`${name} failure displays an error, keeps controls usable, and does not open a broken preview`, async () => {
    const app = setup({ [option]: true });
    await app.generate();
    assert.ok(app.node('status').textContent);
    assert.notEqual(app.node('result-dialog').open, true);
    assert.equal(app.node('generate').disabled, false);
    assert.equal(app.downloads.length, 0);
  });
}