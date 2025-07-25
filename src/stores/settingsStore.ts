import { defineStore } from 'pinia';
import { ref, toRaw, watch, type Ref } from 'vue';
import { SettingsService } from '@/services/settingsService';

export interface Settings {
  showTagCount: boolean;
  showDiffSection: boolean;
  showCaptionDiffList: boolean;
  showTagGroups: boolean;
  theme: string;
  autocomplete: boolean;
  autocompleteFile: string;
  tagsIgnored: string[];
  taggerPort: number;
  recursiveDatasetLoad: boolean;
  autoCheckUpdates: boolean;
}

interface SettingsChangeRecord {
  key: keyof Settings;
  previous: Settings[keyof Settings];
  value: Settings[keyof Settings];
}

export const useSettingsStore = defineStore('settings', () => {
  const showTagCount = ref<boolean>(false);
  const showDiffSection = ref<boolean>(true);
  const showCaptionDiffList = ref<boolean>(true);
  const showTagGroups = ref<boolean>(true);
  const theme = ref<string>('dark');
  const autocomplete = ref<boolean>(true);
  const autocompleteFile = ref<string>('');
  const tagsIgnored = ref<string[]>([]);
  const taggerPort = ref<number>(3067);
  const recursiveDatasetLoad = ref<boolean>(false);
  const autoCheckUpdates = ref<boolean>(true);
  const settingsUndoStack = ref<SettingsChangeRecord[]>([]);
  const settingsRedoStack = ref<SettingsChangeRecord[]>([]);
  const isInitialized = ref(false);
  const settingsService = new SettingsService();
  const settingsMap: Record<keyof Settings, Ref<Settings[keyof Settings]>> = {
    showTagCount,
    showDiffSection,
    showCaptionDiffList,
    showTagGroups,
    theme,
    autocomplete,
    autocompleteFile,
    tagsIgnored,
    taggerPort,
    recursiveDatasetLoad,
    autoCheckUpdates,
  };

  function pushSettingsChange(change: SettingsChangeRecord) {
    settingsUndoStack.value.push(change);
    settingsRedoStack.value = [];
  }

  function undoSettingsAction() {
    const change = settingsUndoStack.value.pop();
    if (!change) return;

    settingsRedoStack.value.push(change);
    isInitialized.value = false;
    settingsMap[change.key].value = change.previous as Settings[keyof Settings];

    if (change.key === 'theme') loadTheme(theme.value);
    setTimeout(() => isInitialized.value = true, 0);
  }

  function redoSettingsAction() {
    const change = settingsRedoStack.value.pop();
    if (!change) return;

    settingsUndoStack.value.push(change);
    isInitialized.value = false;
    settingsMap[change.key].value = change.value as Settings[keyof Settings];

    if (change.key === 'theme') loadTheme(theme.value);
    setTimeout(() => isInitialized.value = true, 0);
  }

  function resetSettingsStatus() {
    settingsUndoStack.value = [];
    settingsRedoStack.value = [];
  }

  watch(showTagCount, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'showTagCount', previous: oldVal, value: newVal });
  });

  watch(showDiffSection, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'showDiffSection', previous: oldVal, value: newVal });
  });

  watch(showCaptionDiffList, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'showCaptionDiffList', previous: oldVal, value: newVal });
  });

  watch(showTagGroups, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'showTagGroups', previous: oldVal, value: newVal });
  });

  watch(theme, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'theme', previous: oldVal, value: newVal });
  });

  watch(autocomplete, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'autocomplete', previous: oldVal, value: newVal });
  });

  watch(autocompleteFile, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'autocompleteFile', previous: oldVal, value: newVal });
  });

  watch(tagsIgnored, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'tagsIgnored', previous: [...oldVal], value: [...newVal] });
  });

  watch(taggerPort, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'taggerPort', previous: oldVal, value: newVal });
  });

  watch(recursiveDatasetLoad, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'recursiveDatasetLoad', previous: oldVal, value: newVal });
  });

  watch(autoCheckUpdates, (newVal, oldVal) => {
    if (!isInitialized.value) return;
    pushSettingsChange({ key: 'autoCheckUpdates', previous: oldVal, value: newVal });
  });

  async function loadSettings() {
    isInitialized.value = false;
    const settings = (await settingsService.loadSettings()) as Settings;
    theme.value = settings.theme ?? theme.value;
    showTagCount.value = settings.showTagCount ?? showTagCount.value;
    showDiffSection.value = settings.showDiffSection ?? showDiffSection.value;
    showCaptionDiffList.value = settings.showCaptionDiffList ?? showCaptionDiffList.value;
    showTagGroups.value = settings.showTagGroups ?? showTagGroups.value;
    autocomplete.value = settings.autocomplete ?? autocomplete.value;
    autocompleteFile.value = settings.autocompleteFile ?? autocompleteFile.value;
    tagsIgnored.value = [...new Set(settings.tagsIgnored ?? tagsIgnored.value)];
    taggerPort.value = settings.taggerPort ?? taggerPort.value;
    recursiveDatasetLoad.value = settings.recursiveDatasetLoad ?? recursiveDatasetLoad.value;
    autoCheckUpdates.value = settings.autoCheckUpdates ?? autoCheckUpdates.value;
    resetSettingsStatus();
    isInitialized.value = true;
  }

  async function saveSettings() {
    await settingsService.saveSettings({
      showTagCount: toRaw(showTagCount.value),
      showDiffSection: toRaw(showDiffSection.value),
      showCaptionDiffList: toRaw(showCaptionDiffList.value),
      showTagGroups: toRaw(showTagGroups.value),
      theme: toRaw(theme.value),
      autocomplete: toRaw(autocomplete.value),
      autocompleteFile: toRaw(autocompleteFile.value),
      tagsIgnored: [...new Set(tagsIgnored.value)],
      taggerPort: toRaw(taggerPort.value),
      recursiveDatasetLoad: toRaw(recursiveDatasetLoad.value),
      autoCheckUpdates: toRaw(autoCheckUpdates.value),
    });
    resetSettingsStatus();
  }

  async function areSettingsSaved() {
    return settingsService.compareSettingsChanges({
      showTagCount: toRaw(showTagCount.value),
      showDiffSection: toRaw(showDiffSection.value),
      showCaptionDiffList: toRaw(showCaptionDiffList.value),
      showTagGroups: toRaw(showTagGroups.value),
      theme: toRaw(theme.value),
      autocomplete: toRaw(autocomplete.value),
      autocompleteFile: toRaw(autocompleteFile.value),
      tagsIgnored: [...new Set(tagsIgnored.value)],
      taggerPort: toRaw(taggerPort.value),
      recursiveDatasetLoad: toRaw(recursiveDatasetLoad.value),
      autoCheckUpdates: toRaw(autoCheckUpdates.value),
    });
  }

  function loadTheme(th?: string) {
    const app = document.documentElement;
    app.dataset.theme = th || theme.value;
    if (th) theme.value = th;
  }

  async function changeAutocompleteFile() {
    const filePath = (await settingsService.changeAutocompleteFile()) as string | null;
    if (filePath) {
      autocompleteFile.value = filePath;
      await saveSettings();
    }
  }

  return {
    showTagCount,
    showDiffSection,
    showCaptionDiffList,
    showTagGroups,
    theme,
    autocomplete,
    autocompleteFile,
    tagsIgnored,
    taggerPort,
    recursiveDatasetLoad,
    autoCheckUpdates,
    undoSettingsAction,
    redoSettingsAction,
    loadSettings,
    saveSettings,
    areSettingsSaved,
    loadTheme,
    changeAutocompleteFile,
  };
});
