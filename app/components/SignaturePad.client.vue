<template>
  <div class="flex flex-col gap-3">
    <div
      ref="canvasWrapper"
      class="relative bg-white rounded-xl border border-slate-300 overflow-hidden cursor-crosshair"
      :style="{ height: canvasHeight + 'px' }"
    >
      <canvas
        ref="canvas"
        class="w-full h-full touch-none"
        @pointerdown="startStroke"
        @pointermove="drawStroke"
        @pointerup="endStroke"
        @pointerleave="endStroke"
      />
      <div v-if="!hasSignature" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span class="text-sm text-slate-300 font-medium">Firma aquí</span>
      </div>
    </div>
    <div class="flex justify-between items-center">
      <span class="text-xs text-slate-400">{{ hasSignature ? 'Firma capturada' : 'Dibuja con el dedo o mouse' }}</span>
      <button @click="clear" class="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">
        Borrar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits<{
  (e: 'signature', dataUrl: string): void;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasWrapper = ref<HTMLElement | null>(null);
const hasSignature = ref(false);
const canvasHeight = ref(160);

let ctx: CanvasRenderingContext2D | null = null;
let isDrawing = false;
let lastPoint: { x: number; y: number } | null = null;

const resizeCanvas = () => {
  if (!canvas.value || !canvasWrapper.value) return;
  const rect = canvasWrapper.value.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.value.width = rect.width * dpr;
  canvas.value.height = canvasHeight.value * dpr;

  ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#1e293b';
};

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas);
});

const getPoint = (e: PointerEvent) => {
  if (!canvas.value) return { x: 0, y: 0 };
  const rect = canvas.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
};

const startStroke = (e: PointerEvent) => {
  if (!ctx) return;
  isDrawing = true;
  lastPoint = getPoint(e);
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  hasSignature.value = true;
};

const drawStroke = (e: PointerEvent) => {
  if (!isDrawing || !ctx || !lastPoint) return;
  const point = getPoint(e);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastPoint = point;
};

const endStroke = () => {
  if (!isDrawing) return;
  isDrawing = false;
  lastPoint = null;
  if (ctx) ctx.closePath();
  emitSignature();
};

const clear = () => {
  if (!canvas.value || !ctx) return;
  const rect = canvas.value.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  hasSignature.value = false;
};

const emitSignature = () => {
  if (!canvas.value) return;
  const dataUrl = canvas.value.toDataURL('image/png');
  emit('signature', dataUrl);
};

defineExpose({
  clear,
});
</script>
