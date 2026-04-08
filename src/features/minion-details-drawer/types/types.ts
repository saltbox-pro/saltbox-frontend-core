import { MinionDetailsProps } from "saltbox-core/shared/components/minion-details/minion-details";
import type { MinionDetailsDrawerOpenParams } from "saltbox-core/widgets/minion-details-drawer";

export type MinionDetailsDrawerWrapperSelectedMinion = {
  minionId: string;
  master: string;
} | null;

export type MinionDetailsDrawerController = {
  isOpened: boolean;
  openedArg: MinionDetailsDrawerOpenParams | null;
  open: (arg: MinionDetailsDrawerOpenParams) => void | Promise<void>;
  close: () => void;
  toggle: (arg: MinionDetailsDrawerOpenParams) => void | Promise<void>;
};

export type MinionDetailsDrawerWrapperProps = {
  drawer?: MinionDetailsDrawerController;
  onFilterButton?: MinionDetailsProps["onFilterButton"];
};
