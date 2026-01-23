import { Config, ISettings, KeyBinding } from "lossless-cut-application";
import { injectable } from "tsyringe";
import { app } from "electron";
import fs from "fs";
import path from "path";

@injectable()
export class Settings implements ISettings {
    private settingsPath: string;
    private settings: { customOutDir?: string; [key: string]: any } = {};

    constructor() {
        this.settingsPath = path.join(app.getPath("userData"), "settings.json");
        this.loadSettings();
    }
    getDefaults(): Config {
        return defaults;
    }

    private loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, "utf-8");
                this.settings = JSON.parse(data);
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
        }
    }

    private saveSettings() {
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        } catch (err) {
            console.error("Failed to save settings:", err);
        }
    }

    // getCustomOutDir(): string | undefined {
    //     return this.settings.customOutDir;
    // }

    // setCustomOutDir(path: string | undefined): void {
    //     if (path === undefined) {
    //         delete this.settings.customOutDir;
    //     } else {
    //         this.settings.customOutDir = path;
    //     }
    //     this.saveSettings();
    // }

    get<T>(key: string): T | undefined {
        return this.settings[key];
    }

    set<T>(key: string, value: T): void {
        this.settings[key] = value;
        this.saveSettings();
    }

    reset(key: string): void {
        delete this.settings[key];
        this.saveSettings();
    }
}

const defaultKeyBindings: KeyBinding[] = [
  { keys: 'ShiftLeft+Equal', action: 'addSegment' },
  { keys: 'Space', action: 'togglePlayResetSpeed' },
  { keys: 'KeyK', action: 'togglePlayNoResetSpeed' },
  { keys: 'KeyJ', action: 'reducePlaybackRate' },
  { keys: 'ShiftLeft+KeyJ', action: 'reducePlaybackRateMore' },
  { keys: 'KeyL', action: 'increasePlaybackRate' },
  { keys: 'ShiftLeft+KeyL', action: 'increasePlaybackRateMore' },
  { keys: 'KeyZ', action: 'timelineToggleComfortZoom' },
  { keys: 'ShiftLeft+KeyZ', action: 'makeCursorTimeZero' },
  { keys: 'Comma', action: 'seekPreviousFrame' },
  { keys: 'Period', action: 'seekNextFrame' },
  { keys: 'KeyC', action: 'captureSnapshot' },
  { keys: 'ControlLeft+KeyC', action: 'copySegmentsToClipboard' },
  { keys: 'MetaLeft+KeyC', action: 'copySegmentsToClipboard' },
  { keys: 'ShiftLeft+KeyC', action: 'captureSnapshotToClipboard' },

  { keys: 'KeyI', action: 'setCutStart' },
  { keys: 'KeyO', action: 'setCutEnd' },
  { keys: 'Backspace', action: 'removeCurrentCutpoint' },
  { keys: 'KeyD', action: 'cleanupFilesDialog' },
  { keys: 'KeyB', action: 'splitCurrentSegment' },
  { keys: 'KeyR', action: 'increaseRotation' },
  { keys: 'KeyG', action: 'goToTimecode' },
  { keys: 'KeyT', action: 'toggleStripAll' },
  { keys: 'ShiftLeft+KeyT', action: 'toggleStripCurrentFilter' },

  { keys: 'ArrowLeft', action: 'seekBackwards' },
  { keys: 'ControlLeft+ShiftLeft+ArrowLeft', action: 'seekBackwards2' },
  { keys: 'ControlLeft+ArrowLeft', action: 'seekBackwardsPercent' },
  { keys: 'MetaLeft+ArrowLeft', action: 'seekBackwardsPercent' },
  { keys: 'AltLeft+ArrowLeft', action: 'seekBackwardsKeyframe' },
  { keys: 'ShiftLeft+ArrowLeft', action: 'jumpCutStart' },

  { keys: 'ArrowRight', action: 'seekForwards' },
  { keys: 'ControlLeft+ShiftLeft+ArrowRight', action: 'seekForwards2' },
  { keys: 'ControlLeft+ArrowRight', action: 'seekForwardsPercent' },
  { keys: 'MetaLeft+ArrowRight', action: 'seekForwardsPercent' },
  { keys: 'AltLeft+ArrowRight', action: 'seekForwardsKeyframe' },
  { keys: 'ShiftLeft+ArrowRight', action: 'jumpCutEnd' },

  { keys: 'ControlLeft+Home', action: 'jumpTimelineStart' },
  { keys: 'ControlLeft+End', action: 'jumpTimelineEnd' },

  { keys: 'PageUp', action: 'jumpFirstSegment' },
  { keys: 'ArrowUp', action: 'jumpPrevSegment' },
  { keys: 'ShiftLeft+AltLeft+PageUp', action: 'jumpSeekFirstSegment' },
  { keys: 'ShiftLeft+AltLeft+ArrowUp', action: 'jumpSeekPrevSegment' },
  { keys: 'ControlLeft+ArrowUp', action: 'timelineZoomIn' },
  { keys: 'MetaLeft+ArrowUp', action: 'timelineZoomIn' },
  { keys: 'ShiftLeft+ArrowUp', action: 'batchPreviousFile' },
  { keys: 'ControlLeft+ShiftLeft+ArrowUp', action: 'batchOpenPreviousFile' },

  { keys: 'PageDown', action: 'jumpLastSegment' },
  { keys: 'ArrowDown', action: 'jumpNextSegment' },
  { keys: 'ShiftLeft+AltLeft+PageDown', action: 'jumpSeekLastSegment' },
  { keys: 'ShiftLeft+AltLeft+ArrowDown', action: 'jumpSeekNextSegment' },
  { keys: 'ControlLeft+ArrowDown', action: 'timelineZoomOut' },
  { keys: 'MetaLeft+ArrowDown', action: 'timelineZoomOut' },
  { keys: 'ShiftLeft+ArrowDown', action: 'batchNextFile' },
  { keys: 'ControlLeft+ShiftLeft+ArrowDown', action: 'batchOpenNextFile' },

  { keys: 'ShiftLeft+Enter', action: 'batchOpenSelectedFile' },

  // https://github.com/mifi/lossless-cut/issues/610
  { keys: 'ControlLeft+KeyZ', action: 'undo' },
  { keys: 'MetaLeft+KeyZ', action: 'undo' },
  { keys: 'ControlLeft+ShiftLeft+KeyZ', action: 'redo' },
  { keys: 'MetaLeft+ShiftLeft+KeyZ', action: 'redo' },

  { keys: 'KeyF', action: 'toggleFullscreenVideo' },

  { keys: 'Enter', action: 'labelCurrentSegment' },

  { keys: 'KeyE', action: 'export' },
  { keys: 'ShiftLeft+Slash', action: 'toggleKeyboardShortcuts' },

  { keys: 'AltLeft+ArrowUp', action: 'increaseVolume' },
  { keys: 'AltLeft+ArrowDown', action: 'decreaseVolume' },
  { keys: 'KeyM', action: 'toggleMuted' },
];


const defaults: Config = {
  version: 1,
  lastAppVersion: '0.1',// app.getVersion(),
  captureFormat: 'jpeg',
  customOutDir: undefined,
  keyframeCut: true,
  autoMerge: false,
  autoDeleteMergedSegments: true,
  segmentsToChaptersOnly: false,
  enableSmartCut: false,
  timecodeFormat: 'timecodeWithDecimalFraction',
  invertCutSegments: false,
  autoExportExtraStreams: true,
  exportConfirmEnabled: true,
  askBeforeClose: false,
  enableAskForImportChapters: true,
  enableAskForFileOpenAction: true,
  playbackVolume: 0.3, // so that we don't shock new users with loud volume
  autoSaveProjectFile: true,
  wheelSensitivity: 0.2,
  waveformHeight: 40,
  language: 'en',// fallbackLng,
  ffmpegExperimental: false,
  preserveChapters: true,
  preserveMetadata: 'default',
  preserveMetadataOnMerge: false,
  preserveMovData: false,
  movFastStart: true,
  avoidNegativeTs: 'make_zero',
  hideNotifications: undefined,
  hideOsNotifications: undefined,
  autoLoadTimecode: false,
  segmentsToChapters: false,
  simpleMode: true,
  outSegTemplate: undefined,
  mergedFileTemplate: undefined,
  mergedFilesTemplate: undefined,
  keyboardSeekAccFactor: 1.03,
  keyboardNormalSeekSpeed: 1,
  keyboardSeekSpeed2: 10,
  keyboardSeekSpeed3: 60,
  treatInputFileModifiedTimeAsStart: true,
  treatOutputFileModifiedTimeAsStart: true,
  outFormatLocked: undefined,
  safeOutputFileName: true,
  windowBounds: undefined,
  enableAutoHtml5ify: true,
  keyBindings: defaultKeyBindings,
  customFfPath: undefined,
  storeProjectInWorkingDir: true,
  enableOverwriteOutput: true,
  mouseWheelZoomModifierKey: 'ctrl',
  mouseWheelFrameSeekModifierKey: 'alt',
  mouseWheelKeyframeSeekModifierKey: 'shift',
  segmentMouseModifierKey: 'shift',
  captureFrameMethod: 'videotag', // we don't default to ffmpeg because ffmpeg might choose a frame slightly off
  captureFrameQuality: 0.95,
  captureFrameFileNameFormat: 'timestamp',
  enableNativeHevc: true,
  enableUpdateCheck: true,
  cleanupChoices: {
    trashTmpFiles: true, askForCleanup: true, closeFile: true, cleanupAfterExport: false,
  },
  allowMultipleInstances: false,
  darkMode: true,
  preferStrongColors: false,
  outputFileNameMinZeroPadding: 1,
  cutFromAdjustmentFrames: 0,
  cutToAdjustmentFrames: 0,
  invertTimelineScroll: undefined,
  storeWindowBounds: true,
  waveformMode: undefined,
  thumbnailsEnabled: false,
  keyframesEnabled: true,
  reducedMotion: 'user',
};