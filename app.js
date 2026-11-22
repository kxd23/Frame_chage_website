import { constrain, imageRect, zoomAt } from './geometry.mjs';

const $ = id => document.getElementById(id);
const SIZE = 1024;
const canvas = $('preview');
const context = canvas.getContext('2d');
const frameButtons = [...document.querySelectorAll('[data-frame]')];
const frames = new Map();
let avatar = null;
let frame = null;
let selectedId = 1;
let transform = { x: 0, y: 0, scale: 1 };
let busy = false;
let frameRequest = 0;
let resultUrl = null;
const pointers = new Map();
let gesture = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片读取失败，请尝试 JPG、PNG 或 WebP 格式。'));
    image.src = src;
  });
}
function loadFrame(id) {
  if (!frames.has(id)) {
    const pending = loadImage(`./assets/frames/frame-${id}.png`).catch(error => {
      frames.delete(id);
      throw error;
    });
    frames.set(id, pending);
  }
  return frames.get(id);
}
function status(message = '') { $('status').textContent = message; }
function updateControls() {
  canvas.setAttribute('data-has-avatar', String(Boolean(avatar)));
  $('choose').disabled = busy || !frame;
  $('choose').textContent = busy ? '正在处理…' : avatar ? '换一张照片' : '从相册选择照片';
  $('generate').disabled = busy || !avatar || !frame;
  $('reset').disabled = busy || !avatar;
  $('zoom').disabled = busy || !avatar;
  $('zoom').value = transform.scale;
  $('zoom-value').value = `${Math.round(transform.scale * 100)}%`;
  frameButtons.forEach(button => {
    button.disabled = busy;
    const active = Number(button.dataset.frame) === selectedId;
    button.setAttribute('aria-pressed', String(active));
    button.querySelector('small').textContent = active ? '已选择' : '试试看';
  });
}
function draw() {
  context.clearRect(0, 0, SIZE, SIZE);
  context.fillStyle = '#f0eafa';
  context.fillRect(0, 0, SIZE, SIZE);
  if (avatar) {
    const rect = imageRect(transform, avatar.width / avatar.height, SIZE);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(avatar, rect.x, rect.y, rect.width, rect.height);
  } else {
    context.fillStyle = '#dcd0eb';
    context.beginPath();
    context.arc(512, 410, 108, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(512, 760, 225, 190, 0, Math.PI, Math.PI * 2);
    context.fill();
    context.fillStyle = '#6c5586';
    context.textAlign = 'center';
    context.font = '42px "Microsoft YaHei", sans-serif';
    context.fillText('你的星光，在这里', 512, 550);
  }
  if (frame) context.drawImage(frame, 0, 0, SIZE, SIZE);
}
function resetPosition() {
  pointers.clear(); gesture = null;
  transform = { x: 0, y: 0, scale: 1 };
  updateControls(); draw();
}

$('choose').addEventListener('click', () => $('photo').click());
$('photo').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file || busy) return;
  if (file.type && !file.type.startsWith('image/')) { status('请选择一张图片。'); return; }
  if (file.size > 25 * 1024 * 1024) { status('图片超过 25 MB，请选择较小的照片。'); return; }
  busy = true; pointers.clear(); gesture = null; updateControls(); status('正在读取照片…');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 48000000) {
      throw new Error('图片尺寸过大，请先缩小照片后再试。');
    }
    // Limit retained photo memory while keeping substantially more detail than export.
    const ratio = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight));
    const photo = document.createElement('canvas');
    photo.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    photo.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = photo.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, photo.width, photo.height);
    avatar = photo;
    resetPosition();
    $('preview-label').textContent = '实时预览';
    $('photo-hint').textContent = `原图 ${image.naturalWidth} × ${image.naturalHeight} 像素。${Math.min(image.naturalWidth, image.naturalHeight) < 1024 ? '原图偏小，导出放大不会增加细节。' : '可自由拖动、缩放，调整到喜欢的位置。'}`;
    status('');
  } catch (error) { status(error.message); }
  finally { URL.revokeObjectURL(url); busy = false; updateControls(); }
});

frameButtons.forEach(button => button.addEventListener('click', async () => {
  if (busy) return;
  busy = true; updateControls();
  const request = ++frameRequest;
  const id = Number(button.dataset.frame);
  status('正在加载头像框…');
  try {
    const nextFrame = await loadFrame(id);
    if (request !== frameRequest) return;
    frame = nextFrame; selectedId = id;
    $('loading').hidden = true;
    updateControls(); draw(); status('');
  } catch {
    if (request === frameRequest) status('头像框加载失败，请检查网络后重新点击。');
  } finally {
    busy = false; updateControls();
  }
}));
$('reset').addEventListener('click', resetPosition);
$('zoom').addEventListener('input', event => {
  if (!avatar || busy) return;
  transform = zoomAt(transform, Number(event.target.value), { x: .5, y: .5 }, { x: .5, y: .5 });
  pointers.clear(); gesture = null; updateControls(); draw();
});

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
}
function metrics() {
  const points = [...pointers.values()].slice(0, 2);
  return points.length === 1 ? { center: points[0], distance: 0 } : {
    center: { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 },
    distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
  };
}
function startGesture() {
  gesture = pointers.size ? { ...metrics(), transform: { ...transform } } : null;
}
canvas.addEventListener('pointerdown', event => {
  if (!avatar || busy || event.button > 0) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, point(event)); startGesture();
});
canvas.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId) || !gesture || busy) return;
  event.preventDefault(); pointers.set(event.pointerId, point(event));
  const current = metrics();
  const scale = gesture.distance > .001 ? gesture.transform.scale * current.distance / gesture.distance : gesture.transform.scale;
  transform = zoomAt(gesture.transform, scale, gesture.center, current.center);
  updateControls(); draw();
});
function endPointer(event) { pointers.delete(event.pointerId); startGesture(); }
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, endPointer));
window.addEventListener('blur', () => { pointers.clear(); gesture = null; });
canvas.addEventListener('wheel', event => {
  if (!avatar || busy) return;
  event.preventDefault();
  const anchor = point(event);
  transform = zoomAt(transform, transform.scale * Math.exp(-event.deltaY * .001), anchor, anchor);
  updateControls(); draw();
}, { passive: false });
canvas.addEventListener('keydown', event => {
  if (!avatar || busy) return;
  const delta = { ArrowLeft: [-.01, 0], ArrowRight: [.01, 0], ArrowUp: [0, -.01], ArrowDown: [0, .01] }[event.key];
  if (!delta) return;
  event.preventDefault();
  transform = constrain({ ...transform, x: transform.x + delta[0], y: transform.y + delta[1] });
  draw();
});

$('generate').addEventListener('click', async () => {
  if (!avatar || !frame || busy) return;
  busy = true; pointers.clear(); gesture = null; updateControls(); status('正在生成新头像…');
  try {
    draw();
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片生成失败，请重试。')), 'image/png'));
    // Android WeChat's native save menu may not resolve page-owned blob URLs.
    // Embed the same PNG bytes in the preview; keep a Blob URL for downloading.
    const previewData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('图片准备失败，请重新生成。'));
      reader.onabort = () => reject(new Error('图片准备已取消，请重新生成。'));
      reader.readAsDataURL(blob);
    });
    await loadImage(previewData);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    $('result-image').src = previewData;
    $('download').href = resultUrl;
    $('download').download = `一百零一夜-星光${selectedId}.png`;
    $('result-dialog').showModal(); status('');
  } catch (error) { status(error.message || '生成失败，请重新尝试。'); }
  finally { busy = false; updateControls(); }
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('privacy').addEventListener('click', () => $('privacy-dialog').showModal());
let shareMessageTimer;
function showShareMessage(message, duration) {
  clearTimeout(shareMessageTimer);
  const notice = $('share-status');
  notice.textContent = message;
  notice.hidden = false;
  shareMessageTimer = setTimeout(() => { notice.hidden = true; }, duration);
}
$('share').addEventListener('click', async () => {
  const button = $('share');
  if (button.disabled) return;
  button.disabled = true;
  showShareMessage('正在复制链接…', 8000);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(location.href);
    showShareMessage('链接已复制，可以发给朋友啦！', 5000);
  } catch {
    showShareMessage('未能自动复制，请从微信右上角菜单或浏览器地址栏手动复制链接。', 10000);
  } finally {
    button.disabled = false;
  }
});

async function init() {
  try {
    if (!context || !window.PointerEvent || !HTMLDialogElement.prototype.showModal) throw new Error('请更新微信或使用新版浏览器打开。');
    frame = await loadFrame(1);
    $('loading').hidden = true;
    updateControls(); draw();
  } catch (error) {
    $('loading').textContent = '加载失败，请刷新页面重试';
    status(error.message);
    // Keep frame buttons enabled so a failed initial asset can be retried.
    updateControls();
  }
}
init();
