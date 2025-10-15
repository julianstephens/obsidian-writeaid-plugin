import { debug, DEBUG_PREFIX } from "@/core/utils";
import type { WriteAidManager } from "@/manager";
import { RestoreBackupModal } from "@/ui/modals/RestoreBackupModal";

export function listBackupsCommand(manager: WriteAidManager) {
  return async () => {
    debug(`${DEBUG_PREFIX} List backups command called`);

    const modal = new RestoreBackupModal(manager.app, manager);
    modal.open();
  };
}