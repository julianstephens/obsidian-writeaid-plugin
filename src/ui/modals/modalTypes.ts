export interface ConvertIndexModalProps {
  folders: string[];
  onSubmit: (projectPath: string, asChecklist: boolean) => void;
}

export interface SelectProjectModalProps {
  folders: string[];
  onSubmit: (projectPath: string) => void;
}

export interface CreateDraftModalProps {
  suggestedName: string;
  drafts: string[];
  projectPath?: string;
  onSubmit: (draftName: string, copyFrom?: string) => void;
}
