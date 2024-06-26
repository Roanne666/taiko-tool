<style scoped></style>

<template>
  <n-flex vertical justify="center">
    <n-scrollbar style="max-height: 90vh">
      <n-flex justify="center">
        <canvas ref="canvasRef" width="1080" height="1200"></canvas>
      </n-flex>
      <n-back-top :right="props.backTopRight" :bottom="20" />
    </n-scrollbar>
    <n-flex justify="center">
      <audio ref="audioRef" controls oncontextmenu="return false" controlslist="nodownload" style="width: 1000px" />
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { BEAT_WIDTH, MARGIN_X, MARGIN_Y, ROW_HEIGHT, ROW_SPACE, createBeatmap } from "@/scripts/beatmap";
import type { Beatmap } from "@/scripts/types";
import { DrawStrokeAction, getBeatmapRows } from "@/scripts/utils";
import type { DifficlutyType, Song } from "@server/types";
import { NFlex, NScrollbar, NBackTop } from "naive-ui";
import { ref, watch } from "vue";
const canvasRef = ref<HTMLCanvasElement>();
const audioRef = ref<HTMLAudioElement>();
const canvasHeight = ref(1200);

const sourceImage = new Image();
let imageUid = -1;

const props = defineProps<{
  currentSong: Song | undefined;
  currentDifficulty: DifficlutyType;
  backTopRight: number;
  showOptions: string[];
  updateCount?: number;
}>();

watch(props, () => {
  if (!audioRef.value) return;
  if (!canvasRef.value) return;
  const { currentSong, currentDifficulty, showOptions, updateCount } = props;

  if (currentSong) {
    if (!updateCount || updateCount === 0) {
      const { dir, wave } = currentSong;
      audioRef.value.src = dir + "\\" + wave;
    }

    const showBar = showOptions.includes("bar");
    const showBpm = showOptions.includes("bpm");
    const showHs = showOptions.includes("hs");
    const { beatmap, imageData } = createBeatmap(canvasRef.value, currentSong, currentDifficulty, {
      showBar,
      showBpm,
      showHs,
    });

    sourceImage.src = imageData.data;
    imageUid = imageData.uid;
    sourceImage.onload = async () => {
      if (!canvasRef.value) return;
      const context = canvasRef.value.getContext("2d") as CanvasRenderingContext2D;

      const beatmapRows = getBeatmapRows(beatmap);

      nextFrame(() => {
        if (!audioRef.value) return false;
        if (imageUid !== imageData.uid) return false;
        if (audioRef.value.paused) return true;
        if (audioRef.value.currentTime + currentSong.offset <= 0) return true;

        const { currentX, row } = getCurrentPos(currentSong, beatmap, beatmapRows);

        context.drawImage(sourceImage, 0, 0);
        new DrawStrokeAction({
          color: "red",
          lineWidth: 2,
          x1: currentX,
          y1: MARGIN_Y + row * (ROW_SPACE + ROW_HEIGHT) - 15,
          x2: currentX,
          y2: MARGIN_Y + row * (ROW_SPACE + ROW_HEIGHT) + 45,
        }).draw(context);

        return true;
      });
    };
    canvasHeight.value = canvasRef.value.height + 1000;
  } else {
    audioRef.value.pause();
    audioRef.value.currentTime = 0;
  }
});

function nextFrame(callback: () => boolean) {
  requestAnimationFrame(() => {
    if (callback()) nextFrame(callback);
  });
}

function getCurrentPos(song: Song, beatmap: Beatmap, beatmapRows: number[]): { currentX: number; row: number } {
  if (!audioRef.value) return { currentX: 0, row: 0 };

  let currentX = MARGIN_X;

  let totalBeatCount = 0;

  let row = 0;
  let rowBeatCount = 0;

  // beat per second，每秒经过的节拍
  let bps = song.bpm / 60;

  // 与4/4拍相对的速度，例如4/16拍则为4倍速
  let speed = 1;

  // 当前的延迟
  let delay = 0;

  let time = audioRef.value.currentTime + song.offset - delay;
  while (time > 0) {
    const beat = beatmap.beats[totalBeatCount];
    for (let i = 0; i < beat.length; i++) {
      const subCount = i / beat.length;
      const change = beatmap.changes[totalBeatCount + subCount];
      if (change?.bpm) bps = change.bpm / 60;
      if (change?.measure) speed = change.measure[1] / 4;
      if (change?.delay) delay = change.delay;

      const subBeatTime = 1 / beat.length / bps / speed;
      if (time > subBeatTime) {
        time -= subBeatTime;
      } else {
        const restCount = time * bps * speed;
        const finalCount = subCount + restCount;
        currentX = MARGIN_X + (rowBeatCount + finalCount) * BEAT_WIDTH;
        time = 0;
        break;
      }

      if (i === beat.length - 1) {
        rowBeatCount += 1;
        if (rowBeatCount >= beatmapRows[row]) {
          rowBeatCount = 0;
          row += 1;
        }
        totalBeatCount += 1;
      }
    }
  }

  return { currentX, row };
}
</script>
