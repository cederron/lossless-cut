import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { container } from 'tsyringe';
import { TOKENS, type IUtils } from 'lossless-cut-application';
import { FaFolder, FaFile, FaLevelUpAlt, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import pMap from 'p-map';

import * as Dialog from './Dialog';
import Button, { DialogButton } from './Button';
import HighlightedText from './HighlightedText';

const utils = container.resolve<IUtils>(TOKENS.Utils);

type FileEntry = {
  name: string;
  isDirectory: boolean;
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '5px 10px',
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const selectedStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary-color, #007bff)',
  color: 'white',
};

type DialogProperty = 'openFile' | 'openDirectory' | 'multiSelections' | 'createDirectory';

function FileBrowserDialog({
  isOpen,
  onClose,
  onConfirm,
  defaultPath,
  title,
  properties = ['openFile'],
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paths: string[]) => void;
  defaultPath?: string | undefined;
  title?: string;
  properties?: DialogProperty[] | undefined;
}) {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState<string>(defaultPath || '');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  const allowMultiObj = properties?.includes('multiSelections');
  const openDirectory = properties?.includes('openDirectory');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        let path = currentPath;
        if (!path) {
          // If no path, try to get a reasonable default (cwd or user home if possible via some API, but here we might rely on backend default)
          // passing undefined to readdir might work as per interface
          // But IUtils.readdir signature says string | undefined.
          // Let's assume undefined means CWD.
        }

        // If path is a file, go to dirname
        if (path && await utils.isFile(path)) {
            path = await utils.dirname(path);
            if (active) setCurrentPath(path);
        }

        const names = await utils.readdir(path || '.'); 
        // We need to resolve path to absolute if it was '.' to display correctly? 
        // utils.readdir returns names.
        
        // Parallel check for isDirectory
        // This might be heavy if many files.
        const entriesWithStats = await pMap(names, async (name) => {
           const fullPath = await utils.pathJoin(path || '.', name);
           // Handle error if access denied?
           try {
             const isDirectory = await utils.isDirectory(fullPath);
             return { name, isDirectory };
           } catch {
             return { name, isDirectory: false };
           }
        }, { concurrency: 5 });
        
        // Sort: Directories first, then files
        entriesWithStats.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        if (active) {
            setEntries(entriesWithStats);
            setSelectedNames(new Set()); // Clear selection on navigate
        }
      } catch (err) {
        console.error('Failed to read directory', err);
        // Maybe go up or show error?
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [currentPath]);

  const handleEntryClick = useCallback((entry: FileEntry) => {
    setSelectedNames((prev) => {
      const newSet = new Set(allowMultiObj ? prev : []);
      if (newSet.has(entry.name)) {
        newSet.delete(entry.name);
      } else {
        newSet.add(entry.name);
      }
      return newSet;
    });
  }, [allowMultiObj]);

  const handleEntryDoubleClick = useCallback(async (entry: FileEntry) => {
    if (entry.isDirectory) {
      const newPath = await utils.pathJoin(currentPath || '.', entry.name);
      setCurrentPath(newPath);
    }
  }, [currentPath]);

  const handleUp = useCallback(async () => {
    const parent = await utils.dirname(currentPath || '.');
    // Basic check to prevent loop at root
    if (parent !== currentPath) {
        setCurrentPath(parent);
    }
  }, [currentPath]);

  const handleConfirm = useCallback(async () => {
    // If openDirectory and nothing selected, return current dir?
    // Standard dialog: 
    // If 'openDirectory', and no folder selected in list, use currentPath.
    // If files selected, use them.
    
    let resultPaths: string[] = [];
    if (selectedNames.size > 0) {
        resultPaths = await Promise.all(Array.from(selectedNames).map(name => utils.pathJoin(currentPath || '.', name)));
    } else if (openDirectory) {
        resultPaths = [currentPath || '.'];
    }

    onConfirm(resultPaths);
  }, [selectedNames, currentPath, openDirectory, onConfirm]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content style={{ width: '80vw', height: '80vh', display: 'flex', flexDirection: 'column' }}>
          <Dialog.Title>{title || t('Open File')}</Dialog.Title>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <Button onClick={handleUp}><FaLevelUpAlt /></Button>
            <HighlightedText style={{ flex: 1 }}>{currentPath}</HighlightedText>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #444' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center' }}><FaSpinner className="spin" /></div>}
            {!loading && entries.map(entry => (
               <div 
                 key={entry.name}
                 style={{ ...rowStyle, ...(selectedNames.has(entry.name) ? selectedStyle : {}) }}
                 onClick={() => handleEntryClick(entry)}
                 onDoubleClick={() => handleEntryDoubleClick(entry)}
               >
                 <span style={{ marginRight: '10px' }}>
                    {entry.isDirectory ? <FaFolder color="#dcb67a" /> : <FaFile color="#aaa" />}
                 </span>
                 {entry.name}
               </div>
            ))}
          </div>

          <Dialog.ButtonRow>
             <DialogButton onClick={onClose}>{t('Cancel')}</DialogButton>
             <DialogButton primary onClick={handleConfirm}>{t('Select')}</DialogButton>
          </Dialog.ButtonRow>

          <Dialog.CloseButton />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const showCustomOpenDialog = ({
  defaultPath,
  title,
  properties
}: { defaultPath?: string | undefined, title: string, properties?: DialogProperty[] | undefined }) => { // simplified params
  return new Promise<{ canceled: boolean, filePaths: string[] }>((resolve) => {
    const containerEl = document.createElement('div');
    document.body.appendChild(containerEl);
    const root = createRoot(containerEl);

    const close = () => {
        root.unmount();
        document.body.removeChild(containerEl);
    };

    const handleClose = () => {
        close();
        resolve({ canceled: true, filePaths: [] });
    };

    const handleConfirm = (paths: string[]) => {
        close();
        resolve({ canceled: false, filePaths: paths });
    };

    root.render(
        <FileBrowserDialog 
            isOpen={true} 
            onClose={handleClose} 
            onConfirm={handleConfirm}
            defaultPath={defaultPath}
            title={title}
            properties={properties}
        />
    );
  });
}

export default memo(FileBrowserDialog);
