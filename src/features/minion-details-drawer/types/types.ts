import { MinionDetailsProps } from "saltbox-core/shared/components/minion-details/minion-details";

export type MinionDetailsDrawerWrapperSelectedMinion = {
  minionId: string;
  master: string;
} | null;

export type MinionDetailsDrawerWrapperProps = {
  minionId: string;
  master: string;
  onFilterButton?: MinionDetailsProps["onFilterButton"];
  onClose?: () => void;
};
