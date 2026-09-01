// Material Symbols icons, compiled into the bundle at build time by
// unplugin-icons (`~icons/material-symbols/*`). No runtime fetch, so they work
// offline under file://. Add an icon: import it and add a line to ICONS.
import NotificationsActive from "~icons/material-symbols/notifications-active";
import NotificationsOff from "~icons/material-symbols/notifications-off";
import Visibility from "~icons/material-symbols/visibility";
import Edit from "~icons/material-symbols/edit";
import Delete from "~icons/material-symbols/delete";
import Close from "~icons/material-symbols/close";
import Pause from "~icons/material-symbols/pause";
import PlayArrow from "~icons/material-symbols/play-arrow";
import MoreVert from "~icons/material-symbols/more-vert";
import History from "~icons/material-symbols/history";
import Block from "~icons/material-symbols/block";
import Translate from "~icons/material-symbols/translate";
import ContentCopy from "~icons/material-symbols/content-copy";

const ICONS = {
  notifications_active: NotificationsActive,
  notifications_off: NotificationsOff,
  visibility: Visibility,
  edit: Edit,
  delete: Delete,
  close: Close,
  pause: Pause,
  play_arrow: PlayArrow,
  more_vert: MoreVert,
  restore: History,
  block: Block,
  translate: Translate,
  content_copy: ContentCopy,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const Svg = ICONS[name];
  return <Svg width={size} height={size} aria-hidden="true" focusable="false" />;
}
