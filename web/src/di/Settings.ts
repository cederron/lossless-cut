import { type Config, type ISettings } from 'lossless-cut-application';
import { injectable } from 'tsyringe';

@injectable()
export class Settings implements ISettings {
    get<T>(key: string): T | undefined {
        throw new Error('Method not implemented.');
    }
    set<T>(key: string, value: T): void {
        throw new Error('Method not implemented.');
    }
    reset(key: string): void {
        throw new Error('Method not implemented.');
    }
    getDefaults(): Config {
        return defaults;
    }

}

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