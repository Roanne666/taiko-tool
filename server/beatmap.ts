export type Measure = [number, number];

export type Change = { bpm?: number; hs?: number; measure?: Measure; gogotime?: boolean; barline?: boolean; delay?: number };

export type Beatmap = {
  changes: {
    [beatIndex: number]: Change;
  };
  beats: number[][];
};

export function parseBeatmap(lines: string[], start: number) {
  const beatmap: Beatmap = {
    changes: {},
    beats: [],
  };

  let totalBeatCount = 0;

  // 数据变化
  let lastMeasure: Measure = [4, 4];
  let lastHs = -1;
  let lastBpm = -1;
  let lastDelay = 0;

  let currentBar: number[] = [];
  let noteCount = 0;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    if (line.includes("#end")) return { end: i, beatmap };

    if (line.includes("#")) {
      if (line.includes("#measure")) {
        const measureStrings = line.split(" ")[1].split("/");
        lastMeasure = [Number(measureStrings[0]), Number(measureStrings[1])];
        setChange(beatmap.changes, totalBeatCount, "measure", lastMeasure);
      } else if (line.includes("#scroll")) {
        const hs = Number(line.split(" ")[1]);
        if (noteCount > 0) {
          lastHs = hs;
        } else {
          setChange(beatmap.changes, totalBeatCount, "hs", hs);
        }
      } else if (line.includes("#bpmchange")) {
        const bpm = Number(line.split(" ")[1]);
        if (noteCount > 0) {
          lastBpm = bpm;
        } else {
          setChange(beatmap.changes, totalBeatCount, "bpm", bpm);
        }
      } else if (line.includes("#delay")) {
        const delay = Number(line.split(" ")[1]);
        if (noteCount > 0) {
          lastDelay = delay;
        } else {
          setChange(beatmap.changes, totalBeatCount, "delay", delay);
        }
      } else if (line.includes("#gogostart")) setChange(beatmap.changes, totalBeatCount, "gogotime", true);
      else if (line.includes("#gogoend")) setChange(beatmap.changes, totalBeatCount, "gogotime", false);
      else if (line.includes("#barlineon")) setChange(beatmap.changes, totalBeatCount, "barline", true);
      else if (line.includes("#barlineoff")) setChange(beatmap.changes, totalBeatCount, "barline", false);
    } else if (line.includes(",")) {
      // 在小节中间改变数据
      if (noteCount > 0) {
        const changeIndex = totalBeatCount + (noteCount / currentBar.length) * lastMeasure[0];
        if (lastHs > 0) {
          setChange(beatmap.changes, changeIndex, "hs", lastHs);
          lastHs = -1;
        }
        if (lastBpm > 0) {
          setChange(beatmap.changes, changeIndex, "bpm", lastBpm);
          lastBpm = -1;
        }
        if (lastDelay !== 0) {
          setChange(beatmap.changes, changeIndex, "delay", lastDelay);
          lastDelay = 0;
        }
      }

      currentBar.push(
        ...line
          .split(",")[0]
          .split("")
          .map((s) => Number(s))
      );

      const beats = sliceBarToBeats(currentBar, lastMeasure[0]);
      beatmap.beats.push(...beats);

      currentBar = [];
      noteCount = 0;

      totalBeatCount += lastMeasure[0];
    } else if (line.length > 0) {
      currentBar.push(
        ...line
          .split("//")[0]
          .split("")
          .map((s) => Number(s))
      );
      noteCount = currentBar.length;
    }
  }

  return { end: lines.length, beatmap };
}

function sliceBarToBeats(notes: number[], measure: number) {
  let notePerBeat = notes.length > measure ? notes.length / measure : notes.length;

  const beats: number[][] = [];
  let currentBeat: number[] = [];
  for (const note of notes) {
    currentBeat.push(note);
    if (currentBeat.length >= notePerBeat) {
      beats.push(currentBeat);
      currentBeat = [];
    }
  }
  if (currentBeat.length > 0) beats.push(currentBeat);

  return beats;
}

function setChange(changes: { [beatIndex: number]: Change }, index: number, key: keyof Change, value: any) {
  if (changes[index]) {
    changes[index][key] = value;
  } else {
    changes[index] = {
      [key]: value,
    };
  }
}
