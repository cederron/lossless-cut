import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import i18n from 'i18next';
import type { Transition } from 'motion/react';
import { TOKENS, defaults, type Config, type ISettings } from 'lossless-cut-application';

// import type { Config } from '../../../common/types.js';

import { errorToast } from '../swal';
import isDev from '../isDev';
import { mySpring, emitter as animationsEmitter } from '../animations';
import { container } from 'tsyringe';

// const { settings: settingsApi, configStore } = window.require('@electron/remote').require('./index.js') as { settings: ISettings, configStore: { defaults: Config } };
// const { systemPreferences } = window.require('@electron/remote');

// const animationSettings = systemPreferences.getAnimationSettings();

export default function useUserSettingsRoot() {
  const firstUpdateRef = useRef(true);
  const settingsApi = container.resolve<ISettings>(TOKENS.Settings);

  async function safeSetConfig<T extends keyof Config>(keyValue: Record<T, Config[T]>) {
    const entry = Object.entries(keyValue)[0]!;
    const key = entry[0] as T;
    const value = entry[1] as Config[T];

    // Prevent flood-saving all config during mount
    if (firstUpdateRef.current) return;

    if (isDev) console.log('save', key, value);
    try {
      await settingsApi.set(key, value);
    } catch (err) {
      console.error('Failed to set config', key, err);
      errorToast(i18n.t('Unable to save your preferences. Try to disable any anti-virus'));
    }
  }

  useEffect(() => {
    async function init() {
      async function get<T extends keyof Config>(key: T): Promise<Config[T]> {
        return await settingsApi.get<Config[T]>(key) ?? defaults[key];
      }
      setLastAppVersion(await get('lastAppVersion'));
      setCaptureFormat(await get('captureFormat'));
      setCustomOutDir(await get('customOutDir'));
      setKeyframeCut(await get('keyframeCut'));
      setPreserveMetadata(await get('preserveMetadata'));
      setPreserveMetadataOnMerge(await get('preserveMetadataOnMerge'));
      setPreserveMovData(await get('preserveMovData'));
      setPreserveChapters(await get('preserveChapters'));
      setMovFastStart(await get('movFastStart'));
      setAvoidNegativeTs(await get('avoidNegativeTs'));
      setAutoMerge(await get('autoMerge'));
      setTimecodeFormat(await get('timecodeFormat'));
      setInvertCutSegments(await get('invertCutSegments'));
      setAutoExportExtraStreams(await get('autoExportExtraStreams'));
      setAskBeforeClose(await get('askBeforeClose'));
      setEnableAskForImportChapters(await get('enableAskForImportChapters'));
      setEnableAskForFileOpenAction(await get('enableAskForFileOpenAction'));
      setPlaybackVolume(await get('playbackVolume'));
      setAutoSaveProjectFile(await get('autoSaveProjectFile'));
      setWheelSensitivity(await get('wheelSensitivity'));
      setWaveformHeight(await get('waveformHeight'));
      setInvertTimelineScroll(await get('invertTimelineScroll'));
      setLanguage(await get('language'));
      setFfmpegExperimental(await get('ffmpegExperimental'));
      setHideNotifications(await get('hideNotifications'));
      setHideOsNotifications(await get('hideOsNotifications'));
      setAutoLoadTimecode(await get('autoLoadTimecode'));
      setAutoDeleteMergedSegments(await get('autoDeleteMergedSegments'));
      setExportConfirmEnabled(await get('exportConfirmEnabled'));
      setSegmentsToChapters(await get('segmentsToChapters'));
      setSimpleMode(await get('simpleMode'));
      setCutFileTemplate(await get('outSegTemplate'));
      setCutMergedFileTemplate(await get('mergedFileTemplate'));
      setMergedFileTemplate(await get('mergedFilesTemplate'));
      setKeyboardSeekAccFactor(await get('keyboardSeekAccFactor'));
      setKeyboardNormalSeekSpeed(await get('keyboardNormalSeekSpeed'));
      setKeyboardSeekSpeed2(await get('keyboardSeekSpeed2'));
      setKeyboardSeekSpeed3(await get('keyboardSeekSpeed3'));
      setTreatInputFileModifiedTimeAsStart(await get('treatInputFileModifiedTimeAsStart'));
      setTreatOutputFileModifiedTimeAsStart(await get('treatOutputFileModifiedTimeAsStart'));
      setOutFormatLocked(await get('outFormatLocked'));
      setSafeOutputFileName(await get('safeOutputFileName'));
      setEnableAutoHtml5ify(await get('enableAutoHtml5ify'));
      setSegmentsToChaptersOnly(await get('segmentsToChaptersOnly'));
      setKeyBindings(await get('keyBindings'));
      setEnableSmartCut(await get('enableSmartCut'));
      setCustomFfPath(await get('customFfPath'));
      setStoreProjectInWorkingDir(await get('storeProjectInWorkingDir'));
      setEnableOverwriteOutput(await get('enableOverwriteOutput'));
      setMouseWheelZoomModifierKey(await get('mouseWheelZoomModifierKey'));
      setMouseWheelFrameSeekModifierKey(await get('mouseWheelFrameSeekModifierKey'));
      setMouseWheelKeyframeSeekModifierKey(await get('mouseWheelKeyframeSeekModifierKey'));
      setSegmentMouseModifierKey(await get('segmentMouseModifierKey'));
      setCaptureFrameMethod(await get('captureFrameMethod'));
      setCaptureFrameQuality(await get('captureFrameQuality'));
      setCaptureFrameFileNameFormat(await get('captureFrameFileNameFormat'));
      setEnableNativeHevc(await get('enableNativeHevc'));
      setEnableUpdateCheck(await get('enableUpdateCheck'));
      setCleanupChoices(await get('cleanupChoices'));
      setAllowMultipleInstances(await get('allowMultipleInstances'));
      setDarkMode(await get('darkMode'));
      setPreferStrongColors(await get('preferStrongColors'));
      setOutputFileNameMinZeroPadding(await get('outputFileNameMinZeroPadding'));
      setCutFromAdjustmentFrames(await get('cutFromAdjustmentFrames'));
      setCutToAdjustmentFrames(await get('cutToAdjustmentFrames'));
      setStoreWindowBounds(await get('storeWindowBounds'));
      setWaveformMode(await get('waveformMode'));
      setThumbnailsEnabled(await get('thumbnailsEnabled'));
      setKeyframesEnabled(await get('keyframesEnabled'));
      setReducedMotion(await get('reducedMotion'));

      firstUpdateRef.current = false;
    }
    init();
  }, [settingsApi]);

  const [lastAppVersion, setLastAppVersion] = useState<Config['lastAppVersion']>(defaults.lastAppVersion);
  useEffect(() => {
    safeSetConfig({ lastAppVersion });
  }, [lastAppVersion]);

  const [captureFormat, setCaptureFormat] = useState<Config['captureFormat']>(defaults.captureFormat);
  useEffect(() => {
    safeSetConfig({ captureFormat });
  }, [captureFormat]);

  const [customOutDir, setCustomOutDir] = useState<Config['customOutDir']>(defaults.customOutDir);
  useEffect(() => {
    safeSetConfig({ customOutDir });
  }, [customOutDir]);

  const [keyframeCut, setKeyframeCut] = useState<Config['keyframeCut']>(defaults.keyframeCut);
  useEffect(() => {
    safeSetConfig({ keyframeCut });
  }, [keyframeCut]);

  const [preserveMetadata, setPreserveMetadata] = useState<Config['preserveMetadata']>(defaults.preserveMetadata);
  useEffect(() => {
    safeSetConfig({ preserveMetadata });
  }, [preserveMetadata]);

  const [preserveMetadataOnMerge, setPreserveMetadataOnMerge] = useState<Config['preserveMetadataOnMerge']>(defaults.preserveMetadataOnMerge);
  useEffect(() => {
    safeSetConfig({ preserveMetadataOnMerge });
  }, [preserveMetadataOnMerge]);

  const [preserveMovData, setPreserveMovData] = useState<Config['preserveMovData']>(defaults.preserveMovData);
  useEffect(() => {
    safeSetConfig({ preserveMovData });
  }, [preserveMovData]);

  const [preserveChapters, setPreserveChapters] = useState<Config['preserveChapters']>(defaults.preserveChapters);
  useEffect(() => {
    safeSetConfig({ preserveChapters });
  }, [preserveChapters]);

  const [movFastStart, setMovFastStart] = useState<Config['movFastStart']>(defaults.movFastStart);
  useEffect(() => {
    safeSetConfig({ movFastStart });
  }, [movFastStart]);

  const [avoidNegativeTs, setAvoidNegativeTs] = useState<Config['avoidNegativeTs']>(defaults.avoidNegativeTs);
  useEffect(() => {
    safeSetConfig({ avoidNegativeTs });
  }, [avoidNegativeTs]);

  const [autoMerge, setAutoMerge] = useState<Config['autoMerge']>(defaults.autoMerge);
  useEffect(() => {
    safeSetConfig({ autoMerge });
  }, [autoMerge]);

  const [timecodeFormat, setTimecodeFormat] = useState<Config['timecodeFormat']>(defaults.timecodeFormat);
  useEffect(() => {
    safeSetConfig({ timecodeFormat });
  }, [timecodeFormat]);

  const [invertCutSegments, setInvertCutSegments] = useState<Config['invertCutSegments']>(defaults.invertCutSegments);
  useEffect(() => {
    safeSetConfig({ invertCutSegments });
  }, [invertCutSegments]);

  const [autoExportExtraStreams, setAutoExportExtraStreams] = useState<Config['autoExportExtraStreams']>(defaults.autoExportExtraStreams);
  useEffect(() => {
    safeSetConfig({ autoExportExtraStreams });
  }, [autoExportExtraStreams]);

  const [askBeforeClose, setAskBeforeClose] = useState<Config['askBeforeClose']>(defaults.askBeforeClose);
  useEffect(() => {
    safeSetConfig({ askBeforeClose });
  }, [askBeforeClose]);

  const [enableAskForImportChapters, setEnableAskForImportChapters] = useState<Config['enableAskForImportChapters']>(defaults.enableAskForImportChapters);
  useEffect(() => {
    safeSetConfig({ enableAskForImportChapters });
  }, [enableAskForImportChapters]);

  const [enableAskForFileOpenAction, setEnableAskForFileOpenAction] = useState<Config['enableAskForFileOpenAction']>(defaults.enableAskForFileOpenAction);
  useEffect(() => {
    safeSetConfig({ enableAskForFileOpenAction });
  }, [enableAskForFileOpenAction]);

  const [playbackVolume, setPlaybackVolume] = useState<Config['playbackVolume']>(defaults.playbackVolume);
  useEffect(() => {
    safeSetConfig({ playbackVolume });
  }, [playbackVolume]);

  const [autoSaveProjectFile, setAutoSaveProjectFile] = useState<Config['autoSaveProjectFile']>(defaults.autoSaveProjectFile);
  useEffect(() => {
    safeSetConfig({ autoSaveProjectFile });
  }, [autoSaveProjectFile]);

  const [wheelSensitivity, setWheelSensitivity] = useState<Config['wheelSensitivity']>(defaults.wheelSensitivity);
  useEffect(() => {
    safeSetConfig({ wheelSensitivity });
  }, [wheelSensitivity]);

  const [waveformHeight, setWaveformHeight] = useState<Config['waveformHeight']>(defaults.waveformHeight);
  useEffect(() => {
    safeSetConfig({ waveformHeight });
  }, [waveformHeight]);

  const [invertTimelineScroll, setInvertTimelineScroll] = useState<Config['invertTimelineScroll']>(defaults.invertTimelineScroll);
  useEffect(() => {
    safeSetConfig({ invertTimelineScroll });
  }, [invertTimelineScroll]);

  const [language, setLanguage] = useState<Config['language']>(defaults.language);
  useEffect(() => {
    safeSetConfig({ language });
  }, [language]);

  const [ffmpegExperimental, setFfmpegExperimental] = useState<Config['ffmpegExperimental']>(defaults.ffmpegExperimental);
  useEffect(() => {
    safeSetConfig({ ffmpegExperimental });
  }, [ffmpegExperimental]);

  const [hideNotifications, setHideNotifications] = useState<Config['hideNotifications']>(defaults.hideNotifications);
  useEffect(() => {
    safeSetConfig({ hideNotifications });
  }, [hideNotifications]);

  const [hideOsNotifications, setHideOsNotifications] = useState<Config['hideOsNotifications']>(defaults.hideOsNotifications);
  useEffect(() => {
    safeSetConfig({ hideOsNotifications });
  }, [hideOsNotifications]);

  const [autoLoadTimecode, setAutoLoadTimecode] = useState<Config['autoLoadTimecode']>(defaults.autoLoadTimecode);
  useEffect(() => {
    safeSetConfig({ autoLoadTimecode });
  }, [autoLoadTimecode]);

  const [autoDeleteMergedSegments, setAutoDeleteMergedSegments] = useState<Config['autoDeleteMergedSegments']>(defaults.autoDeleteMergedSegments);
  useEffect(() => {
    safeSetConfig({ autoDeleteMergedSegments });
  }, [autoDeleteMergedSegments]);

  const [exportConfirmEnabled, setExportConfirmEnabled] = useState<Config['exportConfirmEnabled']>(defaults.exportConfirmEnabled);
  useEffect(() => {
    safeSetConfig({ exportConfirmEnabled });
  }, [exportConfirmEnabled]);

  const [segmentsToChapters, setSegmentsToChapters] = useState<Config['segmentsToChapters']>(defaults.segmentsToChapters);
  useEffect(() => {
    safeSetConfig({ segmentsToChapters });
  }, [segmentsToChapters]);

  const [simpleMode, setSimpleMode] = useState<Config['simpleMode']>(defaults.simpleMode);
  useEffect(() => {
    safeSetConfig({ simpleMode });
  }, [simpleMode]);

  const [cutFileTemplate, setCutFileTemplate] = useState<Config['outSegTemplate']>(defaults.outSegTemplate);
  useEffect(() => {
    safeSetConfig({ outSegTemplate: cutFileTemplate });
  }, [cutFileTemplate]);

  const [cutMergedFileTemplate, setCutMergedFileTemplate] = useState<Config['mergedFileTemplate']>(defaults.mergedFileTemplate);
  useEffect(() => {
    safeSetConfig({ mergedFileTemplate: cutMergedFileTemplate });
  }, [cutMergedFileTemplate]);

  const [mergedFileTemplate, setMergedFileTemplate] = useState<Config['mergedFilesTemplate']>(defaults.mergedFilesTemplate);
  useEffect(() => {
    safeSetConfig({ mergedFilesTemplate: mergedFileTemplate });
  }, [mergedFileTemplate]);

  const [keyboardSeekAccFactor, setKeyboardSeekAccFactor] = useState<Config['keyboardSeekAccFactor']>(defaults.keyboardSeekAccFactor);
  useEffect(() => {
    safeSetConfig({ keyboardSeekAccFactor });
  }, [keyboardSeekAccFactor]);

  const [keyboardNormalSeekSpeed, setKeyboardNormalSeekSpeed] = useState<Config['keyboardNormalSeekSpeed']>(defaults.keyboardNormalSeekSpeed);
  useEffect(() => {
    safeSetConfig({ keyboardNormalSeekSpeed });
  }, [keyboardNormalSeekSpeed]);

  const [keyboardSeekSpeed2, setKeyboardSeekSpeed2] = useState<Config['keyboardSeekSpeed2']>(defaults.keyboardSeekSpeed2);
  useEffect(() => {
    safeSetConfig({ keyboardSeekSpeed2 });
  }, [keyboardSeekSpeed2]);

  const [keyboardSeekSpeed3, setKeyboardSeekSpeed3] = useState<Config['keyboardSeekSpeed3']>(defaults.keyboardSeekSpeed3);
  useEffect(() => {
    safeSetConfig({ keyboardSeekSpeed3 });
  }, [keyboardSeekSpeed3]);

  const [treatInputFileModifiedTimeAsStart, setTreatInputFileModifiedTimeAsStart] = useState<Config['treatInputFileModifiedTimeAsStart']>(defaults.treatInputFileModifiedTimeAsStart);
  useEffect(() => {
    safeSetConfig({ treatInputFileModifiedTimeAsStart });
  }, [treatInputFileModifiedTimeAsStart]);

  const [treatOutputFileModifiedTimeAsStart, setTreatOutputFileModifiedTimeAsStart] = useState<Config['treatOutputFileModifiedTimeAsStart']>(defaults.treatOutputFileModifiedTimeAsStart);
  useEffect(() => {
    safeSetConfig({ treatOutputFileModifiedTimeAsStart });
  }, [treatOutputFileModifiedTimeAsStart]);

  const [outFormatLocked, setOutFormatLocked] = useState<Config['outFormatLocked']>(defaults.outFormatLocked);
  useEffect(() => {
    safeSetConfig({ outFormatLocked });
  }, [outFormatLocked]);

  const [safeOutputFileName, setSafeOutputFileName] = useState<Config['safeOutputFileName']>(defaults.safeOutputFileName);
  useEffect(() => {
    safeSetConfig({ safeOutputFileName });
  }, [safeOutputFileName]);

  const [enableAutoHtml5ify, setEnableAutoHtml5ify] = useState<Config['enableAutoHtml5ify']>(defaults.enableAutoHtml5ify);
  useEffect(() => {
    safeSetConfig({ enableAutoHtml5ify });
  }, [enableAutoHtml5ify]);

  const [segmentsToChaptersOnly, setSegmentsToChaptersOnly] = useState<Config['segmentsToChaptersOnly']>(defaults.segmentsToChaptersOnly);
  useEffect(() => {
    safeSetConfig({ segmentsToChaptersOnly });
  }, [segmentsToChaptersOnly]);

  const [keyBindings, setKeyBindings] = useState<Config['keyBindings']>(defaults.keyBindings);
  useEffect(() => {
    safeSetConfig({ keyBindings });
  }, [keyBindings]);

  const [enableSmartCut, setEnableSmartCut] = useState<Config['enableSmartCut']>(defaults.enableSmartCut);
  useEffect(() => {
    safeSetConfig({ enableSmartCut });
  }, [enableSmartCut]);

  const [customFfPath, setCustomFfPath] = useState<Config['customFfPath']>(defaults.customFfPath);
  useEffect(() => {
    safeSetConfig({ customFfPath });
  }, [customFfPath]);

  const [storeProjectInWorkingDir, setStoreProjectInWorkingDir] = useState<Config['storeProjectInWorkingDir']>(defaults.storeProjectInWorkingDir);
  useEffect(() => {
    safeSetConfig({ storeProjectInWorkingDir });
  }, [storeProjectInWorkingDir]);

  const [enableOverwriteOutput, setEnableOverwriteOutput] = useState<Config['enableOverwriteOutput']>(defaults.enableOverwriteOutput);
  useEffect(() => {
    safeSetConfig({ enableOverwriteOutput });
  }, [enableOverwriteOutput]);

  const [mouseWheelZoomModifierKey, setMouseWheelZoomModifierKey] = useState<Config['mouseWheelZoomModifierKey']>(defaults.mouseWheelZoomModifierKey);
  useEffect(() => {
    safeSetConfig({ mouseWheelZoomModifierKey });
  }, [mouseWheelZoomModifierKey]);

  const [mouseWheelFrameSeekModifierKey, setMouseWheelFrameSeekModifierKey] = useState<Config['mouseWheelFrameSeekModifierKey']>(defaults.mouseWheelFrameSeekModifierKey);
  useEffect(() => {
    safeSetConfig({ mouseWheelFrameSeekModifierKey });
  }, [mouseWheelFrameSeekModifierKey]);

  const [mouseWheelKeyframeSeekModifierKey, setMouseWheelKeyframeSeekModifierKey] = useState<Config['mouseWheelKeyframeSeekModifierKey']>(defaults.mouseWheelKeyframeSeekModifierKey);
  useEffect(() => {
    safeSetConfig({ mouseWheelKeyframeSeekModifierKey });
  }, [mouseWheelKeyframeSeekModifierKey]);

  const [segmentMouseModifierKey, setSegmentMouseModifierKey] = useState<Config['segmentMouseModifierKey']>(defaults.segmentMouseModifierKey);
  useEffect(() => {
    safeSetConfig({ segmentMouseModifierKey });
  }, [segmentMouseModifierKey]);

  const [captureFrameMethod, setCaptureFrameMethod] = useState<Config['captureFrameMethod']>(defaults.captureFrameMethod);
  useEffect(() => {
    safeSetConfig({ captureFrameMethod });
  }, [captureFrameMethod]);

  const [captureFrameQuality, setCaptureFrameQuality] = useState<Config['captureFrameQuality']>(defaults.captureFrameQuality);
  useEffect(() => {
    safeSetConfig({ captureFrameQuality });
  }, [captureFrameQuality]);

  const [captureFrameFileNameFormat, setCaptureFrameFileNameFormat] = useState<Config['captureFrameFileNameFormat']>(defaults.captureFrameFileNameFormat);
  useEffect(() => {
    safeSetConfig({ captureFrameFileNameFormat });
  }, [captureFrameFileNameFormat]);

  const [enableNativeHevc, setEnableNativeHevc] = useState<Config['enableNativeHevc']>(defaults.enableNativeHevc);
  useEffect(() => {
    safeSetConfig({ enableNativeHevc });
  }, [enableNativeHevc]);

  const [enableUpdateCheck, setEnableUpdateCheck] = useState<Config['enableUpdateCheck']>(defaults.enableUpdateCheck);
  useEffect(() => {
    safeSetConfig({ enableUpdateCheck });
  }, [enableUpdateCheck]);

  const [cleanupChoices, setCleanupChoices] = useState<Config['cleanupChoices']>(defaults.cleanupChoices);
  useEffect(() => {
    safeSetConfig({ cleanupChoices });
  }, [cleanupChoices]);

  const [allowMultipleInstances, setAllowMultipleInstances] = useState<Config['allowMultipleInstances']>(defaults.allowMultipleInstances);
  useEffect(() => {
    safeSetConfig({ allowMultipleInstances });
  }, [allowMultipleInstances]);

  const [darkMode, setDarkMode] = useState<Config['darkMode']>(defaults.darkMode);
  useEffect(() => {
    safeSetConfig({ darkMode });
  }, [darkMode]);

  const [preferStrongColors, setPreferStrongColors] = useState<Config['preferStrongColors']>(defaults.preferStrongColors);
  useEffect(() => {
    safeSetConfig({ preferStrongColors });
  }, [preferStrongColors]);

  const [outputFileNameMinZeroPadding, setOutputFileNameMinZeroPadding] = useState<Config['outputFileNameMinZeroPadding']>(defaults.outputFileNameMinZeroPadding);
  useEffect(() => {
    safeSetConfig({ outputFileNameMinZeroPadding });
  }, [outputFileNameMinZeroPadding]);

  const [cutFromAdjustmentFrames, setCutFromAdjustmentFrames] = useState<Config['cutFromAdjustmentFrames']>(defaults.cutFromAdjustmentFrames);
  useEffect(() => {
    safeSetConfig({ cutFromAdjustmentFrames });
  }, [cutFromAdjustmentFrames]);

  const [cutToAdjustmentFrames, setCutToAdjustmentFrames] = useState<Config['cutToAdjustmentFrames']>(defaults.cutToAdjustmentFrames);
  useEffect(() => {
    safeSetConfig({ cutToAdjustmentFrames });
  }, [cutToAdjustmentFrames]);

  const [storeWindowBounds, setStoreWindowBounds] = useState<Config['storeWindowBounds']>(defaults.storeWindowBounds);
  useEffect(() => {
    safeSetConfig({ storeWindowBounds });
  }, [storeWindowBounds]);

  const [waveformMode, setWaveformMode] = useState<Config['waveformMode']>(defaults.waveformMode);
  useEffect(() => {
    safeSetConfig({ waveformMode });
  }, [waveformMode]);

  const [thumbnailsEnabled, setThumbnailsEnabled] = useState<Config['thumbnailsEnabled']>(defaults.thumbnailsEnabled);
  useEffect(() => {
    safeSetConfig({ thumbnailsEnabled });
  }, [thumbnailsEnabled]);

  const [keyframesEnabled, setKeyframesEnabled] = useState<Config['keyframesEnabled']>(defaults.keyframesEnabled);
  useEffect(() => {
    safeSetConfig({ keyframesEnabled });
  }, [keyframesEnabled]);

  const [reducedMotion, setReducedMotion] = useState<Config['reducedMotion']>(defaults.reducedMotion);
  useEffect(() => {
    safeSetConfig({ reducedMotion });
  }, [reducedMotion]);


  const resetKeyBindings = useCallback(async () => {
    // configStore.reset('keyBindings');
    await settingsApi.reset('keyBindings');
    setKeyBindings(await settingsApi.get('keyBindings') ?? defaults.keyBindings);
  }, [settingsApi]);

  const toggleDarkMode = useCallback(() => setDarkMode((v) => !v), []);

  const prefersReducedMotion = useMemo(() => {
    if (reducedMotion !== 'user') return reducedMotion === 'always';
    // fallback to electron detected system setting
    // note: user has to restart app for changes here to be detected
    // return animationSettings.prefersReducedMotion;
    return true;
  }, [reducedMotion]);

  useEffect(() => {
    animationsEmitter.emit('reducedMotion', prefersReducedMotion);
  }, [prefersReducedMotion]);

  const springAnimation = useMemo<Transition>(() => (prefersReducedMotion ? { duration: 0 } : mySpring), [prefersReducedMotion]);

  const settings = {
    lastAppVersion,
    captureFormat,
    customOutDir,
    keyframeCut,
    preserveMetadata,
    preserveMetadataOnMerge,
    preserveMovData,
    preserveChapters,
    movFastStart,
    avoidNegativeTs,
    autoMerge,
    timecodeFormat,
    invertCutSegments,
    autoExportExtraStreams,
    askBeforeClose,
    enableAskForImportChapters,
    enableAskForFileOpenAction,
    playbackVolume,
    autoSaveProjectFile,
    wheelSensitivity,
    waveformHeight,
    invertTimelineScroll,
    language,
    ffmpegExperimental,
    hideNotifications,
    hideOsNotifications,
    autoLoadTimecode,
    autoDeleteMergedSegments,
    exportConfirmEnabled,
    segmentsToChapters,
    simpleMode,
    cutFileTemplate,
    cutMergedFileTemplate,
    mergedFileTemplate,
    keyboardSeekAccFactor,
    keyboardNormalSeekSpeed,
    keyboardSeekSpeed2,
    keyboardSeekSpeed3,
    treatInputFileModifiedTimeAsStart,
    treatOutputFileModifiedTimeAsStart,
    outFormatLocked,
    safeOutputFileName,
    enableAutoHtml5ify,
    segmentsToChaptersOnly,
    keyBindings,
    enableSmartCut,
    customFfPath,
    storeProjectInWorkingDir,
    enableOverwriteOutput,
    mouseWheelZoomModifierKey,
    mouseWheelFrameSeekModifierKey,
    mouseWheelKeyframeSeekModifierKey,
    segmentMouseModifierKey,
    captureFrameMethod,
    captureFrameQuality,
    captureFrameFileNameFormat,
    enableNativeHevc,
    enableUpdateCheck,
    cleanupChoices,
    allowMultipleInstances,
    darkMode,
    preferStrongColors,
    outputFileNameMinZeroPadding,
    cutFromAdjustmentFrames,
    cutToAdjustmentFrames,
    storeWindowBounds,
    waveformMode,
    thumbnailsEnabled,
    keyframesEnabled,
    reducedMotion,
  };

  return {
    settings,

    setLastAppVersion,
    setCaptureFormat,
    setCustomOutDir,
    setKeyframeCut,
    setPreserveMetadata,
    setPreserveMetadataOnMerge,
    setPreserveMovData,
    setPreserveChapters,
    setMovFastStart,
    setAvoidNegativeTs,
    setAutoMerge,
    setTimecodeFormat,
    setInvertCutSegments,
    setAutoExportExtraStreams,
    setAskBeforeClose,
    setEnableAskForImportChapters,
    setEnableAskForFileOpenAction,
    setPlaybackVolume,
    setAutoSaveProjectFile,
    setWheelSensitivity,
    setWaveformHeight,
    setInvertTimelineScroll,
    setLanguage,
    setFfmpegExperimental,
    setHideNotifications,
    setHideOsNotifications,
    setAutoLoadTimecode,
    setAutoDeleteMergedSegments,
    setExportConfirmEnabled,
    setSegmentsToChapters,
    setSimpleMode,
    setCutFileTemplate,
    setCutMergedFileTemplate,
    setMergedFileTemplate,
    setKeyboardSeekAccFactor,
    setKeyboardNormalSeekSpeed,
    setKeyboardSeekSpeed2,
    setKeyboardSeekSpeed3,
    setTreatInputFileModifiedTimeAsStart,
    setTreatOutputFileModifiedTimeAsStart,
    setOutFormatLocked,
    setSafeOutputFileName,
    setEnableAutoHtml5ify,
    setSegmentsToChaptersOnly,
    setKeyBindings,
    resetKeyBindings,
    setEnableSmartCut,
    setCustomFfPath,
    setStoreProjectInWorkingDir,
    setEnableOverwriteOutput,
    setMouseWheelZoomModifierKey,
    setMouseWheelFrameSeekModifierKey,
    setMouseWheelKeyframeSeekModifierKey,
    setSegmentMouseModifierKey,
    setCaptureFrameMethod,
    setCaptureFrameQuality,
    setCaptureFrameFileNameFormat,
    setEnableNativeHevc,
    setEnableUpdateCheck,
    setCleanupChoices,
    setAllowMultipleInstances,
    toggleDarkMode,
    setPreferStrongColors,
    setOutputFileNameMinZeroPadding,
    setCutFromAdjustmentFrames,
    setCutToAdjustmentFrames,
    setStoreWindowBounds,
    setWaveformMode,
    setThumbnailsEnabled,
    setKeyframesEnabled,
    prefersReducedMotion,
    setReducedMotion,
    springAnimation,
  };
}

export type UserSettingsRoot = ReturnType<typeof useUserSettingsRoot>;
