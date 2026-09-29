export type ExtraDataRecordSummaryEntry = {
  name: string;
  value: string;
};

export type ExtraDataRecordSummary = {
  entries: ExtraDataRecordSummaryEntry[];
  hiddenCount: number;
};
